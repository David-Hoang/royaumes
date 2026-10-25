'use client'
import { hc } from 'hono/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type ChannelEvent, useChannel } from '@/platform/realtime/use-channel'
import { Entity } from '@/ui/entity'
import type { AchievementsApi } from './api'
import {
  ACHIEVEMENTS_CHANNEL,
  type AchievementStatus,
  groupByCategory,
  newlyUnlocked,
  nextGoal,
  obtainedFirst,
  type PlayerAchievements,
} from './contracts'

/** Client HTTP typé, déduit de la sous-application Hono du module. */
const client = hc<AchievementsApi>('/api/achievements')

/** Libellé affiché pour chaque état de la connexion temps réel. */
const STATUS_LABELS = {
  connecting: 'Connexion...',
  open: 'Temps réel connecté',
  reconnecting: 'Reconnexion...',
} as const

/** Délai entre deux relectures, tant que la projection n'a pas atteint l'événement annoncé. */
const RETRY_MS = 1_000

/** Nombre maximal de relectures pour un même événement annoncé. */
const MAX_READS = 10

/** Clé du stockage du navigateur : les hauts faits déjà montrés à ce joueur. */
const seenKey = (userId: string) => `royaumes:achievements-seen:${userId}`

/** Hauts faits déjà montrés au joueur ; aucun si rien n'est enregistré ou si le stockage échoue. */
function readSeen(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(seenKey(userId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

/** Enregistre les hauts faits montrés ; sans effet si le navigateur refuse le stockage. */
function writeSeen(userId: string, ids: Set<string>) {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify([...ids]))
  } catch {
    // Stockage indisponible : les hauts faits seront de nouveau présentés comme nouveaux.
  }
}

/** Texte d'état d'un haut fait : obtenu, progression, ou non obtenu pour un objectif unique. */
function stateOf(a: AchievementStatus) {
  if (a.unlocked) return 'Obtenu'
  return a.threshold > 1 ? `${a.progress} / ${a.threshold}` : 'Non obtenu'
}

/** Carte d'un haut fait : grisée tant qu'il n'est pas obtenu, animée s'il est nouveau. */
function AchievementCard({
  achievement: a,
  fresh,
}: {
  achievement: AchievementStatus
  fresh: boolean
}) {
  return (
    <li className="achievement" data-unlocked={a.unlocked} data-fresh={fresh || undefined}>
      <h2>
        <Entity kind={a.id} /> {a.name}
        {fresh && <span className="achievement-new">Nouveau !</span>}
      </h2>
      <p className="muted">{a.description}</p>
      <p className="achievement-state">{stateOf(a)}</p>
      {a.threshold > 1 && (
        <progress value={a.progress} max={a.threshold} aria-label={`Progression : ${a.name}`} />
      )}
    </li>
  )
}

// DETTE TECHNIQUE (docs/qualite/dette-technique.md, DT-014) : cet écran est vérifié à la
// main, sans test automatisé.
/** Écran des Hauts faits : la progression du joueur connecté vers chaque distinction. */
export function AchievementsScreen({ userId }: { userId: string }) {
  // undefined : chargement en cours.
  const [data, setData] = useState<PlayerAchievements | undefined>(undefined)
  // Hauts faits nouveaux depuis la dernière visite : leur carte est animée.
  const [fresh, setFresh] = useState<string[]>([])
  // Hauts faits déjà montrés. Absent avant la première lecture : il est alors relu du
  // stockage du navigateur, afin de signaler aussi ce qui a été obtenu en jouant ailleurs.
  const known = useRef<Set<string> | null>(null)

  // REQUÊTE : la lecture déclenche, côté serveur, le rattrapage de la projection.
  // Renvoie la position jusqu'à laquelle la liste reçue est à jour ; 0 en cas d'échec.
  const refresh = useCallback(async () => {
    const res = await client.index.$get()
    if (!res.ok) return 0
    const body = await res.json()
    setData(body)

    const seen = known.current ?? readSeen(userId)
    const added = newlyUnlocked(seen, body.achievements)
    if (added.length > 0) setFresh((current) => [...new Set([...current, ...added])])
    const unlocked = new Set(body.achievements.filter((a) => a.unlocked).map((a) => a.id))
    known.current = unlocked
    writeSeen(userId, unlocked)
    return body.position
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Position du dernier événement annoncé, et indicateur d'une relecture en cours.
  const wanted = useRef(0)
  const following = useRef(false)

  // TEMPS RÉEL : le canal annonce un événement qui peut modifier les compteurs. La liste est
  // relue jusqu'à ce que la projection ait atteint la position de cet événement.
  // DETTE TECHNIQUE (docs/qualite/dette-technique.md, DT-013) : la liste est relue pour
  // tout événement annoncé, y compris ceux des autres joueurs.
  const follow = useCallback(
    async (event: ChannelEvent) => {
      wanted.current = Math.max(wanted.current, event.position)
      // Une relecture est déjà en cours : elle tiendra compte de la nouvelle position.
      if (following.current) return
      following.current = true
      try {
        for (let read = 0; read < MAX_READS; read++) {
          if ((await refresh()) >= wanted.current) return
          await new Promise((resolve) => setTimeout(resolve, RETRY_MS))
        }
      } finally {
        following.current = false
      }
    },
    [refresh],
  )

  const status = useChannel(ACHIEVEMENTS_CHANNEL, follow)
  const achievements = data?.achievements
  const obtained = achievements?.filter((a) => a.unlocked).length ?? 0
  const goal = achievements ? nextGoal(achievements) : null

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>
          <Entity kind="achievements" /> Hauts faits
          {achievements && (
            <span className="muted">
              {' '}
              ({obtained} / {achievements.length})
            </span>
          )}
        </h1>
        <span className="status" data-status={status}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      {goal && (
        <section className="panel next-goal" aria-label="Prochain objectif">
          <p className="muted">Prochain objectif</p>
          <h2>
            <Entity kind={goal.id} /> {goal.name}
          </h2>
          <p className="muted">{goal.description}</p>
          <progress value={goal.progress} max={goal.threshold} aria-label="Progression" />
          <p className="achievement-state">
            {goal.progress} / {goal.threshold}
          </p>
        </section>
      )}
      {achievements &&
        groupByCategory(achievements).map(({ category, achievements: group }) => (
          <section key={category} className="panel">
            <h2>
              <Entity kind={category} showLabel />{' '}
              <span className="muted">
                ({group.filter((a) => a.unlocked).length} / {group.length})
              </span>
            </h2>
            <ul className="achievements">
              {obtainedFirst(group).map((a) => (
                <AchievementCard key={a.id} achievement={a} fresh={fresh.includes(a.id)} />
              ))}
            </ul>
          </section>
        ))}
    </>
  )
}

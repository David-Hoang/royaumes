'use client'
import { hc } from 'hono/client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type ChannelEvent, useChannel } from '@/platform/realtime/use-channel'
import { Entity } from '@/ui/entity'
import type { AchievementsApi } from './api'
import {
  ACHIEVEMENTS_CHANNEL,
  type AchievementStatus,
  groupByCategory,
  groupBySeries,
  newlyUnlocked,
  nextGoal,
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

// DETTE TECHNIQUE (docs/qualite/dette-technique.md, DT-016) : les hauts faits déjà montrés sont
// retenus dans le navigateur, et non sur le serveur.
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

/** Un sceau de cire sur l'étagère : rouge et doré s'il est obtenu, gris sinon, lumineux s'il est nouveau. */
function Seal({
  icon,
  achievement: a,
  fresh,
  selected,
  onSelect,
}: {
  icon: string
  achievement: AchievementStatus
  fresh: boolean
  selected: boolean
  onSelect: () => void
}) {
  const bubble = useRef<HTMLDivElement>(null)
  // La bulle est recentrée si elle déborde de l'écran.
  useLayoutEffect(() => {
    const el = bubble.current
    if (!selected || !el) return
    el.style.setProperty('--shift', '0px')
    const box = el.getBoundingClientRect()
    const margin = 8
    const shift =
      box.left < margin
        ? margin - box.left
        : box.right > window.innerWidth - margin
          ? window.innerWidth - margin - box.right
          : 0
    el.style.setProperty('--shift', `${shift}px`)
  }, [selected])
  return (
    <li className="seal-item">
      <button
        type="button"
        className="seal"
        data-unlocked={a.unlocked}
        data-fresh={fresh || undefined}
        aria-expanded={selected}
        aria-label={`${a.name} : ${stateOf(a)}`}
        onClick={onSelect}
      >
        <span className="seal-wax">
          <Entity kind={icon} />
        </span>
        <span className="seal-name">{a.name}</span>
        {fresh && <span className="achievement-new">Nouveau !</span>}
      </button>
      {selected && (
        <div className="seal-bubble" ref={bubble} role="status">
          <strong>{a.name}</strong>
          <span>{a.description}</span>
          <span className="achievement-state">{stateOf(a)}</span>
          {!a.unlocked && a.threshold > 1 && (
            <progress value={a.progress} max={a.threshold} aria-label={`Progression : ${a.name}`} />
          )}
        </div>
      )}
    </li>
  )
}

/** Un sceau à poser sur une étagère, avec l'icône qui le distingue. */
interface ShelfItem {
  icon: string
  achievement: AchievementStatus
}

/** Une étagère : un titre à gauche, les sceaux alignés à droite, une planche dessous. */
function Shelf({
  label,
  items,
  fresh,
  selectedId,
  onSelect,
}: {
  label: string
  items: ShelfItem[]
  fresh: string[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const reached = items.filter((item) => item.achievement.unlocked).length
  return (
    <li className="shelf">
      <p className="shelf-label">
        {label}
        <span className="muted">
          {' '}
          {reached} / {items.length}
        </span>
      </p>
      <ul className="seals">
        {items.map((item) => (
          <Seal
            key={item.achievement.id}
            icon={item.icon}
            achievement={item.achievement}
            fresh={fresh.includes(item.achievement.id)}
            selected={selectedId === item.achievement.id}
            onSelect={() =>
              onSelect(selectedId === item.achievement.id ? null : item.achievement.id)
            }
          />
        ))}
      </ul>
    </li>
  )
}

/**
 * Les étagères d'une catégorie : une par série, et une seule pour tous les hauts faits
 * uniques, afin de ne pas multiplier les étagères d'un seul sceau.
 */
function shelvesOf(group: AchievementStatus[]) {
  const entries = groupBySeries(group)
  const shelves: { key: string; label: string; items: ShelfItem[] }[] = []
  const singles: ShelfItem[] = []
  for (const entry of entries) {
    if (entry.kind === 'series') {
      shelves.push({
        key: entry.id,
        label: entry.name,
        items: entry.tiers.map((tier) => ({ icon: entry.id, achievement: tier })),
      })
    } else {
      singles.push({ icon: entry.achievement.id, achievement: entry.achievement })
    }
  }
  if (singles.length > 0) shelves.push({ key: 'singles', label: "Faits d'armes", items: singles })
  return shelves
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
  // Sceau dont la bulle d'information est ouverte.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // La bulle se referme par un clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!selectedId) return
    const onPointer = (event: PointerEvent) => {
      if (!(event.target as Element).closest('.seal-item')) setSelectedId(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [selectedId])

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
            <ul className="shelves">
              {shelvesOf(group).map((shelf) => (
                <Shelf
                  key={shelf.key}
                  label={shelf.label}
                  items={shelf.items}
                  fresh={fresh}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ))}
            </ul>
          </section>
        ))}
    </>
  )
}

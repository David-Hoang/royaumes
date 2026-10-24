'use client'
import { hc } from 'hono/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type ChannelEvent, useChannel } from '@/platform/realtime/use-channel'
import { Entity } from '@/ui/entity'
import type { AchievementsApi } from './api'
import { ACHIEVEMENTS_CHANNEL, type AchievementStatus, type PlayerAchievements } from './contracts'

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

/** Texte d'état d'un haut fait : obtenu, progression, ou non obtenu pour un objectif unique. */
function stateOf(a: AchievementStatus) {
  if (a.unlocked) return 'Obtenu'
  return a.threshold > 1 ? `${a.progress} / ${a.threshold}` : 'Non obtenu'
}

/** Carte d'un haut fait : grisée tant qu'il n'est pas obtenu. */
function AchievementCard({ achievement: a }: { achievement: AchievementStatus }) {
  return (
    <li className="achievement" data-unlocked={a.unlocked}>
      <h2>{a.name}</h2>
      <p className="muted">{a.description}</p>
      <p className="achievement-state">{stateOf(a)}</p>
      {a.threshold > 1 && (
        <progress value={a.progress} max={a.threshold} aria-label={`Progression : ${a.name}`} />
      )}
    </li>
  )
}

/** Écran des Hauts faits : la progression du joueur connecté vers chaque distinction. */
export function AchievementsScreen() {
  // undefined : chargement en cours.
  const [data, setData] = useState<PlayerAchievements | undefined>(undefined)

  // REQUÊTE : la lecture déclenche, côté serveur, le rattrapage de la projection.
  // Renvoie la position jusqu'à laquelle la liste reçue est à jour ; 0 en cas d'échec.
  const refresh = useCallback(async () => {
    const res = await client.index.$get()
    if (!res.ok) return 0
    const body = await res.json()
    setData(body)
    return body.position
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Position du dernier événement annoncé, et indicateur d'une relecture en cours.
  const wanted = useRef(0)
  const following = useRef(false)

  // TEMPS RÉEL : le canal annonce un événement qui peut modifier les compteurs. La liste est
  // relue jusqu'à ce que la projection ait atteint la position de cet événement.
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
      <section className="panel" aria-label="Hauts faits du joueur">
        {achievements && (
          <ul className="achievements">
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

'use client'
import { hc } from 'hono/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type ChannelEvent, useChannel } from '@/platform/realtime/use-channel'
import { Entity } from '@/ui/entity'
import type { RankingApi } from './api'
import { RANKING_CHANNEL, type Ranking } from './contracts'
import { PODIUM, PodiumArt } from './scene-art'

/** Client HTTP typé, déduit de la sous-application Hono du module. */
const client = hc<RankingApi>('/api/ranking')

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

/** Critères de tri du tableau. Le rang officiel est celui du serveur, inchangé quel que soit le tri. */
const SORTS = {
  rank: { label: 'Rang', value: (entry: Entry) => -entry.rank },
  gamesWon: { label: 'Victoires', value: (entry: Entry) => entry.gamesWon },
  gamesPlayed: { label: 'Expéditions', value: (entry: Entry) => entry.gamesPlayed },
  gold: { label: 'Or', value: (entry: Entry) => entry.gold },
  bestLoot: { label: 'Meilleur butin', value: (entry: Entry) => entry.bestLoot },
  upgrades: { label: 'Améliorations', value: (entry: Entry) => entry.upgrades },
} as const

type Entry = Ranking['entries'][number]

/** Écran du Classement : les meilleurs joueurs, le joueur connecté étant mis en évidence. */
export function RankingScreen({ userId }: { userId: string }) {
  // undefined : chargement en cours.
  const [ranking, setRanking] = useState<Ranking | undefined>(undefined)
  // Filtres du tableau : une recherche par nom et un critère de tri.
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<keyof typeof SORTS>('rank')

  // REQUÊTE : la lecture déclenche, côté serveur, le rattrapage de la projection.
  // Renvoie la position jusqu'à laquelle le classement reçu est à jour ; 0 en cas d'échec.
  const refresh = useCallback(async () => {
    const res = await client.players.$get()
    if (!res.ok) return 0
    const body = await res.json()
    setRanking(body)
    return body.position
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Position du dernier événement annoncé, et indicateur d'une relecture en cours.
  const wanted = useRef(0)
  const following = useRef(false)

  // TEMPS RÉEL : le canal annonce un événement qui modifie le classement. Le classement est
  // relu jusqu'à ce que la projection ait atteint la position de cet événement : elle peut
  // s'être arrêtée, quelques secondes, devant une position manquante.
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

  const status = useChannel(RANKING_CHANNEL, follow)
  const entries = ranking?.entries
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const found = (entries ?? []).filter((entry) => entry.label.toLowerCase().includes(needle))
    return found.sort((a, b) => SORTS[sortBy].value(b) - SORTS[sortBy].value(a))
  }, [entries, search, sortBy])

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>
          <Entity kind="ranking" /> Classement
        </h1>
        <span className="status" data-status={status}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <section className="panel" aria-label="Classement des joueurs">
        {entries?.length === 0 && <p className="muted">Aucun joueur classé pour le moment.</p>}
        {entries && entries.length > 0 && (
          <section className="podium3" aria-label="Les trois premiers">
            <PodiumArt />
            <ol>
              {PODIUM.places.map((place, index) => {
                const entry = entries[index]
                if (!entry) return null
                return (
                  <li
                    key={entry.playerId}
                    aria-current={entry.playerId === userId ? 'true' : undefined}
                    style={{
                      left: `${(place.x / PODIUM.width) * 100}%`,
                      width: `${(place.w / PODIUM.width) * 100}%`,
                      top: `${((PODIUM.floor - place.h + 16) / PODIUM.height) * 100}%`,
                    }}
                  >
                    <span className="rank-badge">{entry.rank}</span>
                    <strong>{entry.label}</strong>
                    <span>{entry.gamesWon} victoires</span>
                  </li>
                )
              })}
            </ol>
          </section>
        )}
        {entries && entries.length > 0 && (
          <div className="filters">
            <input
              type="search"
              aria-label="Chercher un joueur"
              placeholder="Chercher un joueur"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label>
              Trier par{' '}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof typeof SORTS)}
              >
                {Object.entries(SORTS).map(([key, sort]) => (
                  <option key={key} value={key}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {entries && entries.length > 0 && shown.length === 0 && (
          <p className="muted">Aucun joueur ne correspond.</p>
        )}
        {entries && shown.length > 0 && (
          <table className="ranking">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Joueur</th>
                <th>Victoires</th>
                <th>Expéditions</th>
                <th>
                  <Entity kind="gold" />
                </th>
                <th>Meilleur butin</th>
                <th>Améliorations</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((entry) => (
                <tr
                  key={entry.playerId}
                  aria-current={entry.playerId === userId ? 'true' : undefined}
                >
                  <td className="rank" data-rank={entry.rank <= 3 ? entry.rank : undefined}>
                    {entry.rank}
                  </td>
                  <td>{entry.label}</td>
                  <td>{entry.gamesWon}</td>
                  <td>{entry.gamesPlayed}</td>
                  <td>{entry.gold}</td>
                  <td>{entry.bestLoot}</td>
                  <td>{entry.upgrades}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}

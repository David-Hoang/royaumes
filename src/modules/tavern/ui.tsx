'use client'
import { hc } from 'hono/client'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useChannel } from '@/platform/realtime/use-channel'
import { Entity } from '@/ui/entity'
import type { TavernApi } from './api'
import {
  HEARTBEAT_MS,
  MESSAGE_MAX_LENGTH,
  type MessageError,
  type PresentPlayer,
  TAVERN_CHANNEL,
  type TavernMessage,
} from './contracts'
import { floorPercent, Patron, TABLE_CLEARANCE, TABLES, TavernRoom, WALKABLE } from './scene-art'

/** Client HTTP typé, déduit de la sous-application Hono du module. */
const client = hc<TavernApi>('/api/tavern')

/** Libellé affiché pour chaque état de la connexion temps réel. */
const STATUS_LABELS = {
  connecting: 'Connexion...',
  open: 'Temps réel connecté',
  reconnecting: 'Reconnexion...',
} as const

/** Message affiché au joueur pour chaque erreur. */
function errorText(error: MessageError | { code: 'INVALID_INPUT' }): string {
  switch (error.code) {
    case 'EMPTY_MESSAGE':
      return 'Le message est vide.'
    case 'MESSAGE_TOO_LONG':
      return `Le message dépasse ${error.max} caractères.`
    case 'TOO_MANY_MESSAGES':
      return `Trop de messages : patientez ${Math.ceil(error.retryAfterMs / 1000)} secondes.`
    case 'INVALID_INPUT':
      return 'Saisie invalide.'
  }
}

/** Ajoute des messages à la liste, sans doublon, dans l'ordre de leurs identifiants. */
function merge(current: TavernMessage[], added: TavernMessage[]): TavernMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]))
  for (const message of added) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

/**
 * Départ en cours de transmission. Un signal de présence attend qu'il soit reçu : sans cela,
 * un joueur qui quitte la Taverne puis y revient aussitôt pourrait voir son départ arriver
 * au serveur après son nouveau signal, et disparaître de la liste des présents.
 */
let leaving: Promise<unknown> = Promise.resolve()

/** Signale le départ du joueur. L'option keepalive maintient la requête pendant la fermeture de l'onglet. */
function leave() {
  leaving = fetch('/api/tavern/presence/leave', { method: 'POST', keepalive: true }).catch(() => {})
}

/** Nombre maximal de clients dessinés dans la salle ; les autres sont comptés. */
const MAX_PATRONS = 8

/** Durée pendant laquelle le dernier message d'un joueur reste affiché au-dessus de lui. */
const SPEECH_MS = 30_000

/** Position d'un client sur le sol de la salle (voir scene-art.tsx), et sens de son regard. */
interface Spot {
  u: number
  v: number
  flip: boolean
}

/** Pause entre deux déplacements éventuels des clients. */
const WANDER_MS = 1_500

/** Chance qu'un client se remette en marche à chaque pause. */
const WANDER_CHANCE = 0.35

/** Une place libre du sol : ni sur une table, ni hors de la zone de marche. */
function freeSpot(): { u: number; v: number } {
  for (;;) {
    const u = WALKABLE.minU + Math.random() * (WALKABLE.maxU - WALKABLE.minU)
    const v = WALKABLE.minV + Math.random() * (WALKABLE.maxV - WALKABLE.minV)
    if (TABLES.every((t) => Math.hypot(t.u - u, t.v - v) > TABLE_CLEARANCE)) return { u, v }
  }
}

/** Place de départ d'un client, répartie sans hasard pour que les clients ne se superposent pas. */
const startSpot = (index: number): Spot => ({
  u: 0.3 + ((index * 0.23) % 0.6),
  v: 0.12 + ((index * 0.37) % 0.8),
  flip: false,
})

/**
 * Déplace au hasard les clients dans la salle. Les positions ne servent qu'à l'affichage :
 * le navigateur anime le trajet. Les personnes qui demandent moins d'animations les voient immobiles.
 */
function useWander(ids: string[]): Record<string, Spot> {
  const [spots, setSpots] = useState<Record<string, Spot>>({})
  const key = ids.join('|')
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const present = key ? key.split('|') : []
    const timer = setInterval(() => {
      setSpots((current) => {
        const next = { ...current }
        present.forEach((id, index) => {
          const from = current[id] ?? startSpot(index)
          if (Math.random() > WANDER_CHANCE) return
          const target = freeSpot()
          // À l'écran, la droite correspond à un u qui grandit et un v qui diminue.
          next[id] = { ...target, flip: target.u - target.v < from.u - from.v }
        })
        return next
      })
    }, WANDER_MS)
    return () => clearInterval(timer)
  }, [key])
  return spots
}

/** Heure d'un message, au format local. */
const timeOf = (at: number) =>
  new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** Écran de la Taverne : salon de discussion et joueurs présents. */
export function TavernScreen({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<TavernMessage[]>([])
  const [players, setPlayers] = useState<PresentPlayer[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  // Horloge relue toutes les 10 secondes : elle fait disparaître les bulles des clients.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(timer)
  }, [])

  const spots = useWander(players.slice(0, MAX_PATRONS).map((player) => player.id))

  // REQUÊTE : les derniers messages.
  const refresh = useCallback(async () => {
    const res = await client.messages.$get()
    if (!res.ok) return
    const latest = (await res.json()).messages
    setMessages((current) => merge(current, latest))
  }, [])

  // TEMPS RÉEL : chaque nouveau message est reçu avec son contenu, et ajouté à la liste.
  const status = useChannel(TAVERN_CHANNEL, (event) => {
    setMessages((current) => merge(current, [event.data as unknown as TavernMessage]))
  })

  // À chaque ouverture du canal, y compris après une reconnexion, l'historique est relu :
  // un message publié avant l'abonnement, ou pendant une interruption, n'est pas transmis
  // par le canal, qui ne diffuse que les messages à venir.
  useEffect(() => {
    if (status === 'open') refresh()
  }, [status, refresh])

  // PRÉSENCE : un signal immédiat, puis un signal régulier tant que la page est affichée.
  // Le départ est signalé lorsque le joueur quitte la page ou ferme l'onglet.
  useEffect(() => {
    const beat = async () => {
      await leaving
      const res = await client.presence.$post()
      if (res.ok) setPlayers((await res.json()).players)
    }
    beat()
    const timer = setInterval(beat, HEARTBEAT_MS)
    window.addEventListener('pagehide', leave)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pagehide', leave)
      leave()
    }
  }, [])

  // COMMANDE : publication d'un message.
  async function send(event: FormEvent) {
    event.preventDefault()
    const res = await client.messages.$post({ json: { body: draft } })
    const body = await res.json()
    if ('error' in body) {
      setError(errorText(body.error as MessageError))
    } else {
      setError(null)
      setDraft('')
      setMessages((current) => merge(current, [body.message]))
    }
  }

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>
          <Entity kind="tavern" /> Taverne
        </h1>
        <span className="status" data-status={status}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <section className="scene tavern-scene" aria-label="La salle de la taverne">
        <TavernRoom />
        <ul className="chips" aria-label="Joueurs présents">
          <li className="chip">
            {players.length} {players.length > 1 ? 'clients' : 'client'}
            {players.length > MAX_PATRONS && ` (${MAX_PATRONS} dessinés)`}
          </li>
        </ul>
        <ul className="patrons">
          {players.slice(0, MAX_PATRONS).map((player, index) => {
            const said = messages.findLast((message) => message.authorId === player.id)
            const speaking = said && now - said.postedAt < SPEECH_MS ? said : undefined
            const spot = spots[player.id] ?? startSpot(index)
            const place = floorPercent(spot.u, spot.v)
            return (
              <li
                key={player.id}
                data-mine={player.id === userId || undefined}
                data-flip={spot.flip || undefined}
                style={{
                  left: `${place.left}%`,
                  top: `${place.top}%`,
                  zIndex: Math.round((spot.u + spot.v) * 100),
                }}
              >
                {speaking && <span className="speech">{speaking.body}</span>}
                <Patron index={index} />
                <span className="fig-name">{player.name}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="panel" aria-label="Messages">
        {messages.length === 0 && <p className="muted">Aucun message pour le moment.</p>}
        <ul className="messages bubbles">
          {messages.map((message) => (
            <li key={message.id} data-mine={message.authorId === userId || undefined}>
              <strong>{message.authorName}</strong>
              <span className="bubble">{message.body}</span>
              <span className="muted">{timeOf(message.postedAt)}</span>
            </li>
          ))}
        </ul>
        <form className="row" onSubmit={send}>
          <input
            aria-label="Votre message"
            value={draft}
            maxLength={MESSAGE_MAX_LENGTH * 2}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Votre message"
            style={{ flex: 1 }}
          />
          <button type="submit">Envoyer</button>
        </form>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    </>
  )
}

'use client'
import { hc } from 'hono/client'
import { useCallback, useEffect, useState } from 'react'
import { useChannel } from '@/platform/realtime/use-channel'
import { Entity } from '@/ui/entity'
import type { RealmApi } from './api'
import {
  BUILDINGS,
  type Building,
  type DomainError,
  MAX_LEVEL,
  RESOURCES,
  type Stock,
  stockAt,
  type VillageView,
  villageChannel,
} from './contracts'

/** Client HTTP typé, déduit de la sous-application Hono du module. */
const client = hc<RealmApi>('/api/realm')

/** Erreurs que l'API peut renvoyer : erreurs métier et erreur de validation. */
type ApiError = { code: DomainError['code'] | 'INVALID_INPUT'; message?: string }

/** Message affiché au joueur pour chaque erreur. */
const ERRORS: Record<ApiError['code'], string> = {
  INVALID_INPUT: 'Saisie invalide.',
  ALREADY_FOUNDED: 'Village déjà fondé.',
  NOT_FOUNDED: "Aucun village pour l'instant.",
  MAX_LEVEL_REACHED: 'Niveau maximum atteint.',
  INSUFFICIENT_RESOURCES: 'Ressources insuffisantes.',
}

/** Indique si le stock couvre un coût ; faux si le coût est absent (niveau maximal). */
function canAfford(stock: Stock, cost: Partial<Stock> | null) {
  return !!cost && Object.entries(cost).every(([r, n]) => stock[r as keyof Stock] >= (n ?? 0))
}

/** Première ressource qui manque pour payer un coût, avec la quantité manquante ; absente si le coût est couvert. */
function firstMissing(stock: Stock, cost: Partial<Stock> | null) {
  if (!cost) return undefined
  for (const [r, n] of Object.entries(cost)) {
    const missing = Math.ceil((n ?? 0) - stock[r as keyof Stock])
    if (missing > 0) return { resource: r, missing }
  }
  return undefined
}

/** Libellé affiché pour chaque état de la connexion temps réel. */
const STATUS_LABELS = {
  connecting: 'Connexion...',
  open: 'Temps réel connecté',
  reconnecting: 'Reconnexion...',
} as const

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** Niveau en chiffres romains, comme sur une enseigne ; en chiffres arabes au-delà de X. */
const roman = (level: number) => ROMAN[level] ?? String(level)

/** Position de chaque bâtiment sur le paysage : son centre, en pourcentage de la largeur. */
const SPOTS: Record<Building, number> = { sawmill: 19, quarry: 50, mine: 80 }

/** Croquis d'un bâtiment, à l'encre : une scierie, une carrière ou une mine. */
function BuildingArt({ building }: { building: Building }) {
  const line = { stroke: '#1a120c', strokeWidth: 3.5, strokeLinejoin: 'round' as const }
  switch (building) {
    case 'sawmill':
      return (
        <svg viewBox="0 0 220 210" aria-hidden="true">
          <path d="M20 200 V120 H190 V200 Z" fill="#8a5a33" {...line} />
          <path d="M8 124 L105 56 L202 124 Z" fill="#5a3a22" {...line} />
          <path d="M88 200 V148 H122 V200" fill="#2a1810" {...line} strokeWidth={3} />
          <g stroke="#1a120c" strokeWidth={2.5}>
            <circle cx="150" cy="190" r="12" fill="#c9985a" />
            <circle cx="170" cy="190" r="12" fill="#b8854a" />
            <circle cx="160" cy="170" r="12" fill="#d4a56a" />
          </g>
          <circle cx="42" cy="168" r="26" fill="#b9b0a0" {...line} strokeWidth={3} />
          <circle cx="42" cy="168" r="7" fill="#5a5249" stroke="#1a120c" strokeWidth={2} />
        </svg>
      )
    case 'quarry':
      return (
        <svg viewBox="0 0 220 210" aria-hidden="true">
          <path d="M8 200 L40 90 L110 44 L190 96 L212 200 Z" fill="#8f8678" {...line} />
          <path d="M60 100 L110 60 L150 96 L96 118 Z" fill="#b9b0a0" opacity={0.7} />
          <path d="M110 60 L96 130 L120 200" fill="none" stroke="#5b5348" strokeWidth={3} />
          <g fill="#a39884" stroke="#1a120c" strokeWidth={2.5}>
            <rect x="22" y="176" width="44" height="22" />
            <rect x="150" y="178" width="40" height="20" />
          </g>
          <path d="M170 120 L196 186" stroke="#1a120c" strokeWidth={6} strokeLinecap="round" />
          <path
            d="M158 128 C176 110 196 112 206 124"
            fill="none"
            stroke="#5a5249"
            strokeWidth={6}
            strokeLinecap="round"
          />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 220 210" aria-hidden="true">
          <path d="M6 200 C6 100 56 52 110 52 C164 52 214 100 214 200 Z" fill="#4f5a3e" {...line} />
          <path
            d="M64 200 V128 a46 46 0 0 1 92 0 V200 Z"
            fill="#0f0c09"
            {...line}
            strokeWidth={3}
          />
          <g fill="#8a5a33" stroke="#1a120c" strokeWidth={3}>
            <rect x="56" y="118" width="12" height="82" />
            <rect x="152" y="118" width="12" height="82" />
            <rect x="52" y="110" width="116" height="12" />
          </g>
          <path d="M86 200 L96 176 H130 L138 200" fill="#5a5249" {...line} strokeWidth={3} />
          <circle cx="104" cy="170" r="7" fill="#e0b45a" stroke="#1a120c" strokeWidth={2} />
          <circle cx="120" cy="168" r="6" fill="#f2cf7e" stroke="#1a120c" strokeWidth={2} />
        </svg>
      )
  }
}

/** Le paysage du village au crépuscule : ciel, soleil, montagnes, collines et chemin. */
function VillageSky() {
  return (
    <svg className="scene-art" viewBox="0 0 1280 760" aria-hidden="true">
      <defs>
        <linearGradient id="village-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b2540" />
          <stop offset="45%" stopColor="#8a4b4a" />
          <stop offset="72%" stopColor="#e0a35a" />
        </linearGradient>
        <radialGradient id="village-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffe9b8" />
          <stop offset="60%" stopColor="#ffcf8a" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#ffcf8a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width="1280" height="760" fill="url(#village-dusk)" />
      <circle cx="930" cy="440" r="170" fill="url(#village-sun)" />
      <circle cx="930" cy="440" r="52" fill="#ffe9b8" />
      <path
        d="M0 440 L120 330 L230 420 L360 300 L500 430 L640 350 L760 440 L900 320 L1060 430 L1180 350 L1280 420 V760 H0 Z"
        fill="#3a3550"
        stroke="#1a120c"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d="M0 530 C200 470 360 530 560 510 C760 490 960 540 1280 490 V760 H0 Z"
        fill="#3f4a35"
        stroke="#1a120c"
        strokeWidth={3}
      />
      <path
        d="M0 610 C220 570 420 620 640 600 C860 580 1060 620 1280 590 V760 H0 Z"
        fill="#2f3a28"
        stroke="#1a120c"
        strokeWidth={3}
      />
      <path
        d="M0 690 C240 660 440 700 660 682 C880 664 1080 696 1280 676 V760 H0 Z"
        fill="#26301f"
        stroke="#1a120c"
        strokeWidth={3}
      />
      <path
        d="M120 760 C300 670 420 630 600 610 C760 594 900 610 1100 670"
        fill="none"
        stroke="#c9b28a"
        strokeWidth={22}
        strokeLinecap="round"
        opacity={0.55}
      />
    </svg>
  )
}

/** Écran du Village : fondation, stock et bâtiments, mis à jour en temps réel. */
export function VillageScreen({ userId }: { userId: string }) {
  // undefined : chargement en cours ; null : aucun village fondé.
  const [view, setView] = useState<VillageView | null | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  // Bâtiment dont la fiche est ouverte.
  const [selected, setSelected] = useState<Building | null>(null)

  // La touche Échap ferme la fiche d'un bâtiment.
  useEffect(() => {
    if (!selected) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [selected])

  // REQUÊTE : lecture de la vue du village.
  const refresh = useCallback(async () => {
    const res = await client.village.$get()
    if (res.ok) setView((await res.json()).view)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // TEMPS RÉEL : chaque événement du village, y compris s'il provient d'un autre onglet
  // ou d'un autre appareil, provoque une relecture de la vue.
  const status = useChannel(villageChannel(userId), refresh)

  // Le stock est extrapolé localement deux fois par seconde, sans interroger le serveur.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])

  // COMMANDES : chaque réponse contient la vue à jour, ou une erreur.
  async function found(name: string) {
    const res = await client.village.$post({ json: { name } })
    handle(await res.json())
  }
  async function upgrade(building: Building) {
    const res = await client.village.upgrade.$post({ json: { building } })
    handle(await res.json())
  }
  function handle(body: { view: VillageView } | { error: ApiError }) {
    if ('error' in body) {
      setError(ERRORS[body.error.code])
    } else {
      setError(null)
      setView(body.view)
    }
  }

  const title = (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <h1>
        <Entity kind="village" /> {view?.name ?? 'Royaumes'}
      </h1>
      <span className="status" data-status={status}>
        {STATUS_LABELS[status]}
      </span>
    </div>
  )

  // Chargement en cours.
  if (view === undefined) return title

  // Aucun village : formulaire de fondation.
  if (view === null) {
    return (
      <>
        {title}
        <div className="panel">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              found(String(new FormData(e.currentTarget).get('name')))
            }}
          >
            <label htmlFor="name">Nommez votre village</label>
            <input id="name" name="name" required minLength={2} maxLength={30} />
            <button type="submit">Fonder</button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </>
    )
  }

  // Village fondé : stock extrapolé à l'instant courant, puis bâtiments.
  const stock = stockAt(view, now)
  const open = selected
    ? {
        building: selected,
        level: view.levels[selected],
        cost: view.nextCosts[selected],
        lacking: firstMissing(stock, view.nextCosts[selected]),
      }
    : null
  return (
    <>
      {title}
      <section className="scene" aria-label="Le village">
        <VillageSky />
        <div className="cloud" style={{ top: '14%' }} aria-hidden="true" />
        <div className="cloud slow" style={{ top: '26%' }} aria-hidden="true" />

        <ul className="chips" aria-label="Ressources">
          {RESOURCES.map((r) => (
            <li key={r} className="chip">
              <Entity kind={r} /> {Math.floor(stock[r])}
              <small>+{view.ratesPerMinute[r]} / min</small>
            </li>
          ))}
        </ul>

        {BUILDINGS.map((b) => (
          <button
            key={b}
            type="button"
            className="spot"
            data-built={view.levels[b] > 0}
            style={{ left: `${SPOTS[b]}%` }}
            onClick={() => setSelected(b)}
          >
            <span className="spot-flag">
              <Entity kind={b} showLabel hideGlyph /> {roman(view.levels[b])}
            </span>
            <span
              className="spot-art"
              style={{ transform: `scale(${0.88 + view.levels[b] * 0.03})` }}
            >
              <BuildingArt building={b} />
            </span>
          </button>
        ))}

        {open && (
          <div className="modal-back">
            <dialog open className="scroll modal" aria-label="Fiche du bâtiment">
              <button
                type="button"
                className="modal-close"
                aria-label="Fermer"
                onClick={() => setSelected(null)}
              >
                &times;
              </button>
              <h2>
                <Entity kind={open.building} showLabel />
              </h2>
              <div className="pips" role="img" aria-label={`Niveau ${open.level} sur ${MAX_LEVEL}`}>
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((n) => (
                  <span key={n} className="pip" data-on={n <= open.level} />
                ))}
              </div>
              <p>
                {open.level === 0 ? (
                  'Ce bâtiment n’est pas encore construit.'
                ) : (
                  <>
                    Niveau <strong>{roman(open.level)}</strong>.
                  </>
                )}{' '}
                {open.cost ? 'Coût :' : 'Niveau maximum atteint.'}
              </p>
              {open.cost && (
                <p className="row">
                  {Object.entries(open.cost).map(([r, n]) => (
                    <span key={r} className="cost" data-short={stock[r as keyof Stock] < (n ?? 0)}>
                      <Entity kind={r} /> {n}
                    </span>
                  ))}
                </p>
              )}
              <button
                type="button"
                disabled={!canAfford(stock, open.cost)}
                onClick={() => upgrade(open.building)}
              >
                {open.lacking ? (
                  <>
                    Il manque {open.lacking.missing} <Entity kind={open.lacking.resource} />
                  </>
                ) : open.level === 0 ? (
                  'Construire'
                ) : (
                  'Améliorer'
                )}
              </button>
              {error && <p className="error">{error}</p>}
            </dialog>
          </div>
        )}
      </section>
      {!open && error && <p className="error">{error}</p>}
      <p className="scroll say">Touchez un bâtiment pour voir ce que vous pouvez en faire.</p>
    </>
  )
}

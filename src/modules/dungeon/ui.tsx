'use client'
import { hc } from 'hono/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useChannel } from '@/platform/realtime/use-channel'
import { Entity } from '@/ui/entity'
import { useCountdown } from '@/ui/use-countdown'
import type { DungeonApi } from './api'
import {
  type Action,
  DIFFICULTIES,
  type Difficulty,
  type Effect,
  type GameError,
  type GameView,
  gameChannel,
  MAX_HEROES,
  MONSTERS,
  type Monster,
  type OpenGame,
} from './contracts'
import { DoorArt, DungeonWall, Knight, MonsterArt } from './scene-art'

/** Client HTTP typé, déduit de la sous-application Hono du module. */
const client = hc<DungeonApi>('/api/dungeon')

/** Erreurs que l'API peut renvoyer : erreurs métier et erreur de validation. */
type ApiError = { code: GameError['code'] | 'INVALID_INPUT'; message?: string }

/** Message affiché au joueur pour chaque erreur. */
const ERRORS: Record<ApiError['code'], string> = {
  INVALID_INPUT: 'Saisie invalide.',
  GAME_NOT_FOUND: 'Expédition introuvable.',
  ALREADY_EXISTS: 'Expédition déjà ouverte.',
  WRONG_PHASE: "Cette action n'est plus possible.",
  GAME_FULL: "L'expédition est complète.",
  ALREADY_JOINED: "Vous faites déjà partie de l'expédition.",
  NOT_A_MEMBER: "Vous ne faites pas partie de l'expédition.",
  NOT_HOST: "Seul l'hôte peut lancer l'expédition.",
  NOT_YOUR_TURN: "Ce n'est pas votre tour.",
  HERO_DOWN: 'Votre héros est tombé.',
  ROUND_OVER: 'La manche est déjà terminée.',
  ALREADY_CHOSEN: 'Vous avez déjà choisi votre action.',
  INVALID_TARGET: 'Cible invalide.',
}

/** Libellé de chaque niveau de difficulté. */
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  hard: 'Difficile',
}

/** Couleurs de tunique des héros, dans l'ordre d'arrivée ; un compagnon porte du gris. */
const CLOTHS = ['#8c2f2a', '#2d4f6e', '#4f6b3a', '#6a4a8a']
const PLUMES = ['#b8463a', '#5f8fb8', '#8fbf6a', '#a98be0']

/** Icône (tracé de 24 x 24) de chaque action. */
const RADIAL = {
  attack: 'M14.5 4.5L20 4l-.5 5.5L9 20l-4-4zM5 19l-2 2M7.5 13.5l3 3',
  defend: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z',
  heal: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
} as const

/** Chiffre qui s'envole au-dessus d'un combattant, à la fin d'une manche. */
interface Floater {
  key: string
  target: string
  text: string
  kind: 'damage' | 'heal'
}

/** Libellé affiché pour chaque état de la connexion temps réel. */
const STATUS_LABELS = {
  connecting: 'Connexion...',
  open: 'Temps réel connecté',
  reconnecting: 'Reconnexion...',
} as const

// ---------------------------------------------------------------------------
// Liste des expéditions ouvertes
// ---------------------------------------------------------------------------

/** Écran d'accueil du Donjon : expéditions ouvertes et ouverture d'une expédition. */
export function DungeonLobby() {
  const router = useRouter()
  const [games, setGames] = useState<OpenGame[] | undefined>(undefined)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')

  const refresh = useCallback(async () => {
    const res = await client.games.$get()
    if (res.ok) setGames((await res.json()).games)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function open() {
    const res = await client.games.$post({ json: { difficulty } })
    if (res.ok) router.push(`/dungeon/${(await res.json()).gameId}`)
  }

  return (
    <>
      <h1>
        <Entity kind="dungeon" /> Donjon
      </h1>
      <div className="panel row">
        <label htmlFor="difficulty">Niveau</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {DIFFICULTY_LABELS[level]}
            </option>
          ))}
        </select>
        <button type="button" onClick={open}>
          Ouvrir une nouvelle expédition
        </button>
      </div>
      <section className="panel" aria-label="Expéditions ouvertes">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Expéditions ouvertes</h2>
          <button className="link" type="button" onClick={refresh}>
            Actualiser
          </button>
        </div>
        {games?.length === 0 && <p className="muted">Aucune expédition ouverte pour le moment.</p>}
        <ul className="games">
          {games?.map((game) => (
            <li key={game.gameId}>
              <span>
                Expédition de {game.hostName}{' '}
                <span className="muted">
                  ({game.heroCount}/{MAX_HEROES} héros)
                </span>
              </span>
              <Link href={`/dungeon/${game.gameId}`}>Voir</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------
// Expédition
// ---------------------------------------------------------------------------

/** Nom affiché d'un monstre, numéroté si la salle en contient plusieurs du même type. */
function monsterName(monster: Monster, monsters: Monster[]) {
  const sameKind = monsters.filter((other) => other.kind === monster.kind)
  const name = MONSTERS[monster.kind].name
  return sameKind.length > 1 ? `${name} ${sameKind.indexOf(monster) + 1}` : name
}

/** Description d'une action, telle que le joueur l'a choisie. */
function describeAction(action: Action, nameOf: (id: string) => string) {
  if (action.type === 'attack') return `attaquer ${nameOf(action.target)}`
  if (action.type === 'heal') return `soigner ${nameOf(action.target)}`
  return 'se défendre'
}

/** Préposition « de » devant un verbe à l'infinitif, élidée devant une voyelle. */
const ofVerb = (text: string) => (/^[aeéiou]/i.test(text) ? `d'${text}` : `de ${text}`)

/** Description d'un effet de la dernière manche. */
function describeEffect(effect: Effect, nameOf: (id: string) => string) {
  return effect.kind === 'damage'
    ? `${nameOf(effect.source)} inflige ${effect.amount} dégâts à ${nameOf(effect.target)}`
    : `${nameOf(effect.source)} rend ${effect.amount} points de vie à ${nameOf(effect.target)}`
}

/** Écran d'une expédition : salon, exploration, combat et fin de l'expédition. */
export function DungeonGame({ gameId, userId }: { gameId: string; userId: string }) {
  // undefined : chargement en cours ; null : expédition introuvable.
  const [view, setView] = useState<GameView | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  // Menu radial ouvert autour du héros du joueur, et type de cible attendu après un choix.
  const [targeting, setTargeting] = useState<'attack' | 'heal' | null>(null)
  // Chiffres qui s'envolent à la fin d'une manche.
  const [floaters, setFloaters] = useState<Floater[]>([])
  const seenRound = useRef<number | null | undefined>(undefined)
  const floatTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const param = { id: gameId }

  // REQUÊTE : lecture de la vue de l'expédition, filtrée pour le joueur.
  const refresh = useCallback(async () => {
    const res = await client.games[':id'].$get({ param: { id: gameId } })
    if (res.ok) setView((await res.json()).view)
    else if (res.status === 404) setView(null)
  }, [gameId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // TEMPS RÉEL : seuls les membres écoutent le canal de l'expédition. Le canal ne transmet
  // aucune donnée : chaque notification provoque une relecture de la vue filtrée.
  const status = useChannel(view?.isMember ? gameChannel(gameId) : null, refresh)

  // COMMANDES : chaque réponse contient la vue à jour, ou une erreur.
  function handle(body: { view: GameView } | { error: ApiError }) {
    if ('error' in body) {
      setError(ERRORS[body.error.code])
      refresh()
    } else {
      setError(null)
      setView(body.view)
    }
  }
  const addCompanion = async () =>
    handle(await (await client.games[':id'].companion.$post({ param })).json())
  const join = async () => handle(await (await client.games[':id'].join.$post({ param })).json())
  const start = async () => handle(await (await client.games[':id'].start.$post({ param })).json())
  const openDoor = async () =>
    handle(await (await client.games[':id'].door.$post({ param })).json())
  async function act(action: Action) {
    if (!view) return
    const res = await client.games[':id'].action.$post({
      param,
      json: { round: view.round, action },
    })
    handle(await res.json())
  }

  // ÉCHÉANCE : lorsque le compte à rebours d'une manche ou d'un tour d'exploration atteint
  // zéro, la commande d'échéance fait enregistrer la suite de l'expédition, et donc
  // notifier tous les membres.
  const checkDeadline = useCallback(async () => {
    const res = await client.games[':id'].deadline.$post({
      param: { id: gameId },
    })
    if (res.ok) setView((await res.json()).view)
  }, [gameId])
  const remaining = useCountdown(
    view?.isMember && (view.phase === 'combat' || view.phase === 'exploring')
      ? view.deadline
      : null,
    checkDeadline,
  )

  // DÉGÂTS ET SOINS : quand une nouvelle manche est résolue, ses effets s'envolent au-dessus
  // des combattants. La manche déjà connue à l'ouverture de la page n'est pas rejouée.
  useEffect(() => {
    if (view === undefined) return
    const round = view?.lastRound?.round ?? null
    const known = seenRound.current
    seenRound.current = round
    if (known === undefined || round === null || round === known || !view?.lastRound) return
    setFloaters(
      view.lastRound.effects.map((effect, index) => ({
        key: `${round}-${index}`,
        target: effect.target,
        text: `${effect.kind === 'damage' ? '-' : '+'}${effect.amount}`,
        kind: effect.kind,
      })),
    )
    // Le minuteur n'est pas annulé par une relecture de la vue : seule une nouvelle manche le remplace.
    clearTimeout(floatTimer.current)
    floatTimer.current = setTimeout(() => setFloaters([]), 1600)
  }, [view])
  useEffect(() => () => clearTimeout(floatTimer.current), [])

  const title = (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <h1>
        <Entity kind="dungeon" /> Expédition
        {view && <span className="muted"> - {DIFFICULTY_LABELS[view.difficulty]}</span>}
      </h1>
      {view?.isMember && (
        <span className="status" data-status={status}>
          {STATUS_LABELS[status]}
        </span>
      )}
    </div>
  )

  if (view === undefined) return title
  if (view === null) {
    return (
      <>
        {title}
        <p className="error">{ERRORS.GAME_NOT_FOUND}</p>
        <Link href="/dungeon">Retour au Donjon</Link>
      </>
    )
  }

  // Noms des combattants, pour décrire les actions et les effets.
  const nameOf = (id: string) => {
    const hero = view.heroes.find((h) => h.id === id)
    if (hero) return hero.name
    const monster = view.monsters.find((m) => m.id === id)
    return monster ? monsterName(monster, view.monsters) : id
  }
  const me = view.heroes.find((hero) => hero.id === userId)
  const standingMonsters = view.monsters.filter((monster) => monster.hp > 0)
  const standingHeroes = view.heroes.filter((hero) => hero.hp > 0)
  const inCombat = view.phase === 'combat'
  const ended = view.phase === 'won' || view.phase === 'lost'
  const canChoose = inCombat && !!me && me.hp > 0 && !me.action

  // Un choix d'action referme le mode de ciblage.
  async function choose(action: Action) {
    setTargeting(null)
    await act(action)
  }
  // Une cible n'est demandée que lorsqu'il y a le choix : sinon l'action part directement.
  function pickAttack() {
    const [only] = standingMonsters
    if (only && standingMonsters.length === 1) return choose({ type: 'attack', target: only.id })
    setTargeting('attack')
  }
  function pickHeal() {
    const [only] = standingHeroes
    if (only && standingHeroes.length === 1) return choose({ type: 'heal', target: only.id })
    setTargeting('heal')
  }

  // La phrase du narrateur, sous la scène : ce qu'il est possible de faire maintenant.
  let narration = "Les héros se rassemblent à l'entrée du donjon."
  if (view.phase === 'exploring') {
    narration =
      view.turnHeroId === userId
        ? "C'est à vous : cliquez sur la porte pour l'ouvrir."
        : `Au tour de ${nameOf(view.turnHeroId ?? '')} d'ouvrir la porte.`
  }
  if (inCombat) {
    if (me?.action) {
      narration = `Votre choix : ${describeAction(me.action, nameOf)}. En attente des autres héros.`
    } else if (canChoose) {
      narration = targeting ? 'Choisissez votre cible.' : "Choisissez l'action de votre héros."
    } else {
      narration = 'Vous observez le combat.'
    }
  }
  if (ended)
    narration = view.phase === 'won' ? 'Le donjon est vaincu !' : 'Le donjon vous a vaincus.'

  return (
    <>
      {title}

      <section className="scene dungeon-scene" aria-label="Le donjon">
        <DungeonWall />
        <ul className="chips" aria-label="État de l'expédition">
          <li className="chip">
            {view.room < 0 ? 'Entrée' : `Salle ${view.room + 1} sur ${view.roomCount}`}
          </li>
          <li className="chip">
            <Entity kind="gold" /> {view.loot}
          </li>
        </ul>
        {targeting && (
          <div className="chips chips-center">
            <span className="chip">
              {targeting === 'attack' ? 'Cliquez sur un monstre' : 'Cliquez sur un héros'}
            </span>
            <button type="button" className="chip" onClick={() => setTargeting(null)}>
              Annuler
            </button>
          </div>
        )}
        {remaining !== null && (
          <div className="chips chips-right">
            <span className="chip countdown">{remaining} s</span>
          </div>
        )}

        <div className="scene-heroes">
          {view.heroes.map((hero, index) => {
            const healable = targeting === 'heal' && hero.hp > 0
            const onClick = healable ? () => choose({ type: 'heal', target: hero.id }) : undefined
            return (
              <div
                key={hero.id}
                className="fig-wrap"
                data-down={hero.hp <= 0}
                data-turn={view.turnHeroId === hero.id}
              >
                <Fig onClick={onClick} glow={healable} label={`Soigner ${hero.name}`}>
                  <Knight
                    cloth={
                      hero.companion ? '#4a443c' : (CLOTHS[index % CLOTHS.length] ?? '#8c2f2a')
                    }
                    plume={
                      hero.companion ? '#9a9288' : (PLUMES[index % PLUMES.length] ?? '#b8463a')
                    }
                  />
                </Fig>
                {floaters
                  .filter((floater) => floater.target === hero.id)
                  .map((floater) => (
                    <span key={floater.key} className="floater" data-kind={floater.kind}>
                      {floater.text}
                    </span>
                  ))}
                <span className="fig-name">{hero.name}</span>
                <span className="fig-tags">
                  {hero.id === view.hostId && 'hôte '}
                  {hero.companion && "(piloté par l'ordinateur) "}
                  {inCombat && hero.ready && 'prêt '}
                  {view.turnHeroId === hero.id && 'à son tour'}
                </span>
                <span className="hp">
                  <i style={{ width: `${Math.max(0, (hero.hp / hero.maxHp) * 100)}%` }} />
                </span>
                <span className="fig-tags">
                  {hero.hp}/{hero.maxHp} PV
                </span>
              </div>
            )
          })}
        </div>

        {inCombat && (
          <div className="scene-monsters">
            {view.monsters.map((monster) => {
              const aimable = targeting === 'attack' && monster.hp > 0
              return (
                <div key={monster.id} className="fig-wrap" data-down={monster.hp <= 0}>
                  <Fig
                    onClick={
                      aimable ? () => choose({ type: 'attack', target: monster.id }) : undefined
                    }
                    glow={aimable}
                    label={`Attaquer ${monsterName(monster, view.monsters)}`}
                  >
                    <MonsterArt kind={monster.kind} />
                  </Fig>
                  {floaters
                    .filter((floater) => floater.target === monster.id)
                    .map((floater) => (
                      <span key={floater.key} className="floater" data-kind={floater.kind}>
                        {floater.text}
                      </span>
                    ))}
                  <span className="fig-name">{monsterName(monster, view.monsters)}</span>
                  <span className="hp monster-hp">
                    <i style={{ width: `${Math.max(0, (monster.hp / monster.maxHp) * 100)}%` }} />
                  </span>
                  <span className="fig-tags">
                    {monster.hp}/{monster.maxHp} PV
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {view.phase === 'exploring' && (
          <div className="scene-door">
            <Fig
              onClick={view.turnHeroId === userId ? openDoor : undefined}
              glow={view.turnHeroId === userId}
              label="Ouvrir la porte suivante"
            >
              <DoorArt />
            </Fig>
            {view.currentRoom?.kind === 'treasure' && (
              <span className="fig-tags">Un trésor de {view.currentRoom.gold} or</span>
            )}
            {view.currentRoom?.kind === 'empty' && <span className="fig-tags">Une salle vide</span>}
          </div>
        )}

        {ended && (
          <div className="modal-back">
            <dialog open className="scroll modal" aria-label="Fin de l'expédition">
              <h2>{view.phase === 'won' ? 'Victoire !' : 'Défaite...'}</h2>
              <p>
                Butin de l'expédition : <Entity kind="gold" /> {view.loot}
              </p>
              <Link className="button" href="/dungeon">
                Retour au Donjon
              </Link>
            </dialog>
          </div>
        )}
      </section>

      <p className="scroll say">{narration}</p>
      {canChoose && !targeting && (
        <div className="actions">
          <button type="button" onClick={pickAttack}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={RADIAL.attack} />
            </svg>
            Attaquer
          </button>
          <button type="button" onClick={() => choose({ type: 'defend' })}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={RADIAL.defend} />
            </svg>
            Défendre
          </button>
          <button type="button" onClick={pickHeal}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={RADIAL.heal} />
            </svg>
            Soigner
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}

      {/* Salon : rejoindre ou lancer l'expédition. */}
      {view.phase === 'lobby' && (
        <div className="panel">
          <p className="muted">
            Communiquez l'adresse de cette page aux joueurs que vous souhaitez inviter.
          </p>
          {!view.isMember && view.heroes.length < MAX_HEROES && (
            <button type="button" onClick={join}>
              Rejoindre l'expédition
            </button>
          )}
          {view.isHost && view.heroes.length < MAX_HEROES && (
            <button type="button" onClick={addCompanion}>
              <Entity kind="companion" /> Ajouter un compagnon
            </button>
          )}
          {view.isHost && (
            <button type="button" onClick={start}>
              Entrer dans le donjon
            </button>
          )}
          {view.isMember && !view.isHost && (
            <p className="muted">En attente du lancement par l'hôte.</p>
          )}
        </div>
      )}

      {/* Résultat de la dernière manche, connu de tous une fois la manche résolue. */}
      {view.lastRound && (
        <section className="panel" aria-label="Dernière manche">
          <h2>Manche {view.lastRound.round}</h2>
          <ul className="log">
            {view.lastRound.effects.map((effect) => (
              // Chaque combattant n'agit qu'une fois par manche : ce triplet identifie l'effet.
              <li key={`${effect.kind}-${effect.source}-${effect.target}`} data-kind={effect.kind}>
                {describeEffect(effect, nameOf)}.
              </li>
            ))}
            {Object.entries(view.lastRound.actions).map(([heroId, action]) => (
              <li key={heroId}>
                {nameOf(heroId)} a choisi {ofVerb(describeAction(action, nameOf))}.
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

/** Un élément de la scène : un bouton quand on peut cliquer dessus, un simple dessin sinon. */
function Fig({
  onClick,
  glow,
  label,
  children,
}: {
  onClick?: () => void
  glow: boolean
  label: string
  children: ReactNode
}) {
  if (!onClick) return <div className="fig">{children}</div>
  return (
    <button type="button" className="fig" data-glow={glow} aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

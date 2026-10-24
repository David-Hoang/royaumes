import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDatabase } from '@/platform/db/client'
import {
  createEventStore,
  type EventStore,
  type NewEvent,
} from '@/platform/event-store/event-store'
import { createProjectionRunner } from '@/platform/projection/projection'
import type { StatsReader } from '../application/stats-reader'
import { createDrizzleStatsReader } from './drizzle-stats-reader'

// Chaque test dispose d'un journal neuf et de compteurs vides.
let store: EventStore
let reader: StatsReader
beforeEach(async () => {
  const db = await createTestDatabase()
  store = createEventStore(db)
  reader = createDrizzleStatsReader(db, createProjectionRunner(db))
})

// Événements du Donjon et du Village, réduits aux champs lus par les Hauts faits.
const created = (hostId: string): NewEvent => ({ type: 'GameCreated', data: { hostId } })
const joined = (playerId: string): NewEvent => ({ type: 'PlayerJoined', data: { playerId } })
const companion: NewEvent = { type: 'CompanionAdded', data: { companionId: 'companion-1' } }
const ended = (result: 'won' | 'lost', loot: number): NewEvent => ({
  type: 'GameEnded',
  data: { result, loot },
})

/** Compteurs d'un joueur. */
const statsOf = async (playerId: string) => (await reader.statsOf(playerId)).stats

describe('Projection des hauts faits', () => {
  it("attribue le résultat d'une expédition gagnée à ses joueurs, sans les compagnons", async () => {
    await store.append('dungeon-g1', 0, [
      created('alice'),
      joined('bob'),
      companion,
      ended('won', 40),
    ])

    expect(await statsOf('alice')).toMatchObject({ gamesPlayed: 1, gamesWon: 1, gold: 40 })
    expect(await statsOf('bob')).toMatchObject({ gamesPlayed: 1, gamesWon: 1, gold: 40 })
    expect(await statsOf('companion-1')).toMatchObject({ gamesPlayed: 0 })
  })

  it('compte une défaite comme une expédition, sans victoire ni or', async () => {
    await store.append('dungeon-g1', 0, [created('alice'), ended('lost', 25)])
    expect(await statsOf('alice')).toMatchObject({ gamesPlayed: 1, gamesWon: 0, gold: 0 })
  })

  it('compte les améliorations du Village', async () => {
    await store.append('village-carol', 0, [
      { type: 'VillageFounded', data: { name: 'Valombre' } },
      { type: 'BuildingUpgraded', data: {} },
      { type: 'BuildingUpgraded', data: {} },
    ])
    expect(await statsOf('carol')).toMatchObject({ upgrades: 2 })
  })

  it("n'attribue rien à un joueur inconnu et ne mélange pas les joueurs", async () => {
    await store.append('dungeon-g1', 0, [created('alice'), ended('won', 40)])
    expect(await statsOf('inconnu')).toEqual({ gamesPlayed: 0, gamesWon: 0, upgrades: 0, gold: 0 })
    expect(await statsOf('alice')).toMatchObject({ gamesWon: 1 })
  })

  it("n'applique pas deux fois un même événement quand la lecture est répétée", async () => {
    await store.append('dungeon-g1', 0, [created('alice'), ended('won', 40)])
    await reader.statsOf('alice')
    expect(await statsOf('alice')).toMatchObject({ gamesPlayed: 1, gold: 40 })
  })
})

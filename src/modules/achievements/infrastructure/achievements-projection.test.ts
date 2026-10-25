import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_HEROES } from '@/modules/dungeon/contracts'
import { BUILDINGS, MAX_LEVEL } from '@/modules/realm/contracts'
import { createTestDatabase } from '@/platform/db/client'
import {
  createEventStore,
  type EventStore,
  type NewEvent,
} from '@/platform/event-store/event-store'
import { createProjectionRunner } from '@/platform/projection/projection'
import type { StatsReader } from '../application/stats-reader'
import { EMPTY_STATS } from '../domain/achievements'
import { ACHIEVEMENTS } from '../domain/catalog'
import { createDrizzleStatsReader } from './drizzle-stats-reader'

// Chaque test dispose d'un journal neuf et de compteurs vides.
let store: EventStore
let reader: StatsReader
beforeEach(async () => {
  const db = await createTestDatabase()
  store = createEventStore(db)
  reader = createDrizzleStatsReader(db, createProjectionRunner(db))
})

// DETTE TECHNIQUE (docs/qualite/dette-technique.md, DT-012) : ces événements sont écrits à
// la main ; ils ne suivent pas automatiquement la forme réelle de ceux du Donjon et du Village.
// Événements du Donjon et du Village, réduits aux champs lus par les Hauts faits.
const created = (hostId: string, difficulty?: string): NewEvent => ({
  type: 'GameCreated',
  data: difficulty ? { hostId, difficulty } : { hostId },
})
const joined = (playerId: string): NewEvent => ({ type: 'PlayerJoined', data: { playerId } })
const companion: NewEvent = { type: 'CompanionAdded', data: { companionId: 'companion-1' } }
const ended = (result: 'won' | 'lost', loot: number): NewEvent => ({
  type: 'GameEnded',
  data: { result, loot },
})
const published = (sellerId: string): NewEvent => ({ type: 'OfferPublished', data: { sellerId } })
const accepted = (buyerId: string): NewEvent => ({ type: 'OfferAccepted', data: { buyerId } })
const completed: NewEvent = { type: 'TradeCompleted', data: {} }
const withdrawn: NewEvent = { type: 'OfferWithdrawn', data: { reason: 'seller' } }
const upgraded = (building: string, toLevel: number): NewEvent => ({
  type: 'BuildingUpgraded',
  data: { building, toLevel },
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
    expect(await statsOf('inconnu')).toEqual(EMPTY_STATS)
    expect(await statsOf('alice')).toMatchObject({ gamesWon: 1 })
  })

  it('retient le nombre de compagnons d’une expédition gagnée, par difficulté', async () => {
    await store.append('dungeon-g1', 0, [
      created('alice', 'easy'),
      companion,
      companion,
      ended('won', 40),
    ])
    await store.append('dungeon-g2', 0, [
      created('alice', 'hard'),
      companion,
      companion,
      companion,
      ended('won', 60),
    ])
    expect(await statsOf('alice')).toMatchObject({ easyCompanions: 2, hardCompanions: 3 })
  })

  it('traite comme facile une expédition dont le niveau est absent, et garde le meilleur', async () => {
    await store.append('dungeon-g1', 0, [created('alice'), companion, companion, ended('won', 40)])
    await store.append('dungeon-g2', 0, [created('alice'), companion, ended('won', 40)])
    expect(await statsOf('alice')).toMatchObject({ easyCompanions: 2, hardCompanions: 0 })
  })

  it('ne retient rien pour une expédition perdue', async () => {
    await store.append('dungeon-g1', 0, [created('alice', 'hard'), companion, ended('lost', 10)])
    expect(await statsOf('alice')).toMatchObject({ easyCompanions: 0, hardCompanions: 0 })
  })

  it('ne mélange pas les compagnons de deux expéditions en cours', async () => {
    await store.append('dungeon-g1', 0, [created('alice'), companion, companion])
    await store.append('dungeon-g2', 0, [created('bob'), companion])
    await store.append('dungeon-g1', 3, [ended('won', 40)])
    await store.append('dungeon-g2', 2, [ended('won', 40)])
    expect(await statsOf('alice')).toMatchObject({ easyCompanions: 2 })
    expect(await statsOf('bob')).toMatchObject({ easyCompanions: 1 })
  })

  it('compte une offre publiée pour son vendeur, avant même sa conclusion', async () => {
    await store.append('market-o1', 0, [published('alice')])
    expect(await statsOf('alice')).toMatchObject({ offersPublished: 1, tradesCompleted: 0 })
  })

  it("attribue l'échange conclu au vendeur de l'offre, et non à son acheteur", async () => {
    await store.append('market-o1', 0, [published('alice'), accepted('bob'), completed])
    expect(await statsOf('alice')).toMatchObject({ offersPublished: 1, tradesCompleted: 1 })
    expect(await statsOf('bob')).toEqual(EMPTY_STATS)
  })

  it('ne compte pas comme réussie une offre retirée, et compte chaque offre séparément', async () => {
    await store.append('market-o1', 0, [published('alice'), withdrawn])
    await store.append('market-o2', 0, [published('alice'), accepted('bob'), completed])
    await store.append('market-o3', 0, [published('alice'), accepted('carol'), completed])
    expect(await statsOf('alice')).toMatchObject({ offersPublished: 3, tradesCompleted: 2 })
  })

  it('retient le plus haut niveau atteint par chaque bâtiment, indépendamment des autres', async () => {
    await store.append('village-carol', 0, [
      upgraded('sawmill', 2),
      upgraded('sawmill', 3),
      upgraded('quarry', 2),
    ])
    expect(await statsOf('carol')).toMatchObject({
      upgrades: 3,
      sawmillLevel: 3,
      quarryLevel: 2,
      mineLevel: 0,
    })
  })

  it('garde le plus haut niveau atteint, même si un événement plus ancien arrive ensuite', async () => {
    await store.append('village-carol', 0, [upgraded('mine', 10), upgraded('mine', 2)])
    expect(await statsOf('carol')).toMatchObject({ mineLevel: 10 })
  })

  // Le dernier palier des séries de compagnons est le plus grand nombre de compagnons possible :
  // le nombre maximal de héros, moins l'hôte.
  it('fixe le dernier palier des compagnons au nombre maximal de compagnons du Donjon', () => {
    for (const id of ['easy-3', 'hard-3']) {
      expect(ACHIEVEMENTS.find((def) => def.id === id)?.threshold).toBe(MAX_HEROES - 1)
    }
  })

  // Un haut fait « maître » demande le niveau maximal du Village : si ce niveau change, le
  // seuil du haut fait doit changer avec lui. Chaque bâtiment du Village a ses trois hauts faits.
  it('fixe le seuil des hauts faits « maître » au niveau maximal du Village', () => {
    for (const building of BUILDINGS) {
      const master = ACHIEVEMENTS.find((def) => def.id === `${building}-max`)
      expect(master?.threshold).toBe(MAX_LEVEL)
    }
  })

  it("n'applique pas deux fois un même événement quand la lecture est répétée", async () => {
    await store.append('dungeon-g1', 0, [created('alice'), ended('won', 40)])
    await reader.statsOf('alice')
    expect(await statsOf('alice')).toMatchObject({ gamesPlayed: 1, gold: 40 })
  })
})

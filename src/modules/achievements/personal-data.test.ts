import { beforeEach, describe, expect, it } from 'vitest'
import { createTestDatabase } from '@/platform/db/client'
import { createEventStore } from '@/platform/event-store/event-store'
import type { PersonalDataContributor } from '@/platform/privacy/privacy'
import { createProjectionRunner } from '@/platform/projection/projection'
import { createAchievementsPersonalData } from './personal-data'

// Chaque test dispose d'un journal neuf, de compteurs vides, et de deux joueurs qui ont joué.
let contributor: PersonalDataContributor
beforeEach(async () => {
  const db = await createTestDatabase()
  const store = createEventStore(db)
  contributor = createAchievementsPersonalData(db, createProjectionRunner(db))

  await store.append('dungeon-g1', 0, [
    { type: 'GameCreated', data: { hostId: 'alice' } },
    { type: 'PlayerJoined', data: { playerId: 'bob' } },
    { type: 'GameEnded', data: { result: 'won', loot: 40 } },
  ])
  await store.append('village-alice', 0, [{ type: 'BuildingUpgraded', data: {} }])
})

describe('Données personnelles des Hauts faits', () => {
  it('exporte les compteurs du joueur, et seulement les siens', async () => {
    expect(await contributor.export('alice')).toMatchObject({
      playerId: 'alice',
      gamesPlayed: 1,
      gamesWon: 1,
      gold: 40,
      upgrades: 1,
    })
    expect(await contributor.export('bob')).toMatchObject({ playerId: 'bob', upgrades: 0 })
  })

  it("n'exporte rien pour un joueur qui n'a jamais joué", async () => {
    expect(await contributor.export('inconnu')).toBeNull()
  })

  it('efface les compteurs du joueur sans toucher à ceux des autres', async () => {
    await contributor.erase?.('alice', [])

    expect(await contributor.export('alice')).toBeNull()
    expect(await contributor.export('bob')).toMatchObject({ gamesWon: 1 })
  })

  it("peut être relancé : un second effacement ne produit pas d'erreur", async () => {
    await contributor.erase?.('alice', [])
    await expect(contributor.erase?.('alice', [])).resolves.toBeUndefined()
  })
})

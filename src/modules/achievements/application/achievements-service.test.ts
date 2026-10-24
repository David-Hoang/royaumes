import { describe, expect, it } from 'vitest'
import { EMPTY_STATS } from '../domain/achievements'
import type { Stats } from '../domain/catalog'
import { createAchievementsService } from './achievements-service'
import type { StatsReader } from './stats-reader'

/** Faux port de lecture : renvoie les compteurs prévus pour chaque joueur. */
function fakeReader(byPlayer: Record<string, Stats>): StatsReader {
  return {
    statsOf: async (playerId) => ({ position: 42, stats: byPlayer[playerId] ?? EMPTY_STATS }),
  }
}

describe('Service des Hauts faits', () => {
  it("n'évalue que les compteurs du joueur demandé (règle 6)", async () => {
    const service = createAchievementsService(
      fakeReader({
        alice: { ...EMPTY_STATS, gamesWon: 3 },
        bob: EMPTY_STATS,
      }),
    )

    const alice = await service.forPlayer('alice')
    const bob = await service.forPlayer('bob')

    expect(alice.achievements.find((a) => a.id === 'first-blood')?.unlocked).toBe(true)
    expect(bob.achievements.find((a) => a.id === 'first-blood')?.unlocked).toBe(false)
  })

  it('renvoie la position du journal atteinte par la lecture', async () => {
    const service = createAchievementsService(fakeReader({}))
    expect((await service.forPlayer('inconnu')).position).toBe(42)
  })
})

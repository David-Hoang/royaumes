import { eq } from 'drizzle-orm'
import type { Db } from '@/platform/db/client'
import type { ProjectionRunner } from '@/platform/projection/projection'
import type { StatsReader } from '../application/stats-reader'
import { EMPTY_STATS } from '../domain/achievements'
import { achievementsProjection } from './achievements-projection'
import { playerStats } from './schema'

/** Adaptateur du port StatsReader, fondé sur la table des compteurs. */
export function createDrizzleStatsReader(db: Db, projections: ProjectionRunner): StatsReader {
  return {
    async statsOf(playerId) {
      // Rattrapage à la lecture : la table est mise à jour avant d'être lue.
      await projections.catchUp(achievementsProjection)

      // La position est lue avant la table : la table reflète au moins cette position.
      const position = await projections.positionOf(achievementsProjection.name)
      const [row] = await db.select().from(playerStats).where(eq(playerStats.playerId, playerId))

      // Un joueur sans ligne n'a encore rien fait : tous ses compteurs sont à zéro.
      if (!row) return { position, stats: EMPTY_STATS }
      return {
        position,
        stats: {
          gamesPlayed: row.gamesPlayed,
          gamesWon: row.gamesWon,
          upgrades: row.upgrades,
          gold: row.gold,
          sawmillLevel: row.sawmillLevel,
          quarryLevel: row.quarryLevel,
          mineLevel: row.mineLevel,
          easyCompanions: row.easyCompanions,
          hardCompanions: row.hardCompanions,
          offersPublished: row.offersPublished,
          tradesCompleted: row.tradesCompleted,
        },
      }
    },
  }
}

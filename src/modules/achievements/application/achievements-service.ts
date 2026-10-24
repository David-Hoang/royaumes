import type { PlayerAchievements } from '../contracts'
import { evaluate } from '../domain/achievements'
import type { StatsReader } from './stats-reader'

/**
 * Service applicatif des Hauts faits : lit les compteurs d'un joueur, puis demande au
 * domaine quels hauts faits il a obtenus. Il reçoit son port de lecture en paramètre.
 */
export function createAchievementsService(reader: StatsReader) {
  return {
    /** Les hauts faits d'un joueur, avec leur progression. */
    async forPlayer(playerId: string): Promise<PlayerAchievements> {
      const { position, stats } = await reader.statsOf(playerId)
      return { position, achievements: evaluate(stats) }
    },
  }
}

export type AchievementsService = ReturnType<typeof createAchievementsService>

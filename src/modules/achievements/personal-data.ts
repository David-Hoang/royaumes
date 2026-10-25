import { eq } from 'drizzle-orm'
import type { Db } from '@/platform/db/client'
import type { PersonalDataContributor } from '@/platform/privacy/privacy'
import type { ProjectionRunner } from '@/platform/projection/projection'
import { achievementsProjection } from './infrastructure/achievements-projection'
import { gamePlayers, offers, playerStats } from './infrastructure/schema'

/**
 * Données personnelles des Hauts faits : les compteurs du joueur, rattachés à son identifiant.
 * Le module n'a pas d'événements propres : il n'a rien à réécrire dans le journal.
 */
export function createAchievementsPersonalData(
  db: Db,
  projections: ProjectionRunner,
): PersonalDataContributor {
  return {
    name: 'achievements',

    async export(playerId) {
      // Comme toute lecture du module, l'export rattrape d'abord la projection.
      await projections.catchUp(achievementsProjection)
      const [row] = await db.select().from(playerStats).where(eq(playerStats.playerId, playerId))
      return row ?? null
    },

    // La projection est d'abord rattrapée : sans cela, des événements du joueur pas encore
    // appliqués recréeraient ses lignes après leur suppression.
    async erase(playerId) {
      await projections.catchUp(achievementsProjection)
      await db.delete(gamePlayers).where(eq(gamePlayers.playerId, playerId))
      await db.delete(offers).where(eq(offers.sellerId, playerId))
      await db.delete(playerStats).where(eq(playerStats.playerId, playerId))
    },
  }
}

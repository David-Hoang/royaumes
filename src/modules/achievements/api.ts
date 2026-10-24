import { Hono } from 'hono'
import type { AppEnv } from '@/platform/http/types'
import type { AchievementsService } from './application/achievements-service'

/**
 * Sous-application Hono du module Hauts faits, montée sur /api/achievements.
 * Elle ne comporte qu'une route de lecture : le module n'accepte aucune commande.
 * Le joueur est celui que l'authentification a identifié : personne ne peut consulter
 * les hauts faits d'un autre joueur.
 */
export function createAchievementsApi(service: AchievementsService) {
  // DETTE TECHNIQUE (docs/qualite/dette-technique.md, DT-011) : aucune limitation du
  // débit des lectures ; chaque lecture rattrape la projection.
  return new Hono<AppEnv>().get('/', async (c) => c.json(await service.forPlayer(c.var.userId)))
}

/** Type de la sous-application, utilisé par le client typé de l'interface. */
export type AchievementsApi = ReturnType<typeof createAchievementsApi>

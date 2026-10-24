/**
 * Entrée publique « serveur » du module Hauts faits.
 * Avec contracts.ts et ui.tsx, c'est le seul fichier du module qui peut être
 * importé depuis l'extérieur.
 */
import type { Db } from '@/platform/db/client'
import type { ProjectionRunner } from '@/platform/projection/projection'
import type { ChannelPolicy } from '@/platform/realtime/channel-policy'
import { createAchievementsApi } from './api'
import { createAchievementsService } from './application/achievements-service'
import { ACHIEVEMENTS_CHANNEL } from './contracts'
import { achievementsProjection } from './infrastructure/achievements-projection'
import { createDrizzleStatsReader } from './infrastructure/drizzle-stats-reader'
import { createAchievementsPersonalData } from './personal-data'

export interface AchievementsModuleDeps {
  /** Base de données, dans laquelle le module tient son modèle de lecture. */
  db: Db
  /** Moteur des projections de la plateforme. */
  projections: ProjectionRunner
}

/** Fabrique du module : assemble l'adaptateur de lecture, le service, l'API et la règle du canal. */
export function createAchievementsModule({ db, projections }: AchievementsModuleDeps) {
  const reader = createDrizzleStatsReader(db, projections)
  const service = createAchievementsService(reader)

  // Canal des hauts faits : tout joueur connecté peut l'écouter. C'est un canal global, qui
  // annonce les événements appliqués par la projection, tous flux confondus. Il est discret :
  // les événements du Donjon contiennent la graine de l'expédition, qui ne doit jamais
  // être transmise, et l'interface n'a besoin que de leur position.
  const channelPolicy: ChannelPolicy = {
    prefix: ACHIEVEMENTS_CHANNEL,
    canSubscribe: (channel) => channel === ACHIEVEMENTS_CHANNEL,
    redact: true,
    global: { types: achievementsProjection.eventTypes },
  }

  return {
    api: createAchievementsApi(service),
    channelPolicy,
    personalData: createAchievementsPersonalData(db, projections),
  }
}

export type { AchievementsApi } from './api'

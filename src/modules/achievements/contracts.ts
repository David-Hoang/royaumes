/**
 * Entrée publique « partagée » du module Hauts faits : utilisable par le serveur
 * comme par l'interface.
 */
import type { AchievementStatus } from './domain/achievements'

export type { AchievementStatus } from './domain/achievements'

export { groupByCategory, newlyUnlocked, nextGoal, obtainedFirst } from './domain/achievements'

/** Hauts faits d'un joueur, tels que renvoyés par l'API. */
export interface PlayerAchievements {
  /**
   * Position du journal jusqu'à laquelle les compteurs sont à jour. L'interface la compare
   * à la position des événements annoncés par le canal du module.
   */
  position: number
  achievements: AchievementStatus[]
}

/** Nom du canal temps réel des Hauts faits, qui ne correspond à aucun flux du journal. */
export const ACHIEVEMENTS_CHANNEL = 'achievements'

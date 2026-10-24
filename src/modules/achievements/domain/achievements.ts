import { ACHIEVEMENTS, type AchievementDef, type Stats } from './catalog'

/** État d'un haut fait pour un joueur : sa progression, et s'il est obtenu. */
export interface AchievementStatus {
  id: string
  name: string
  description: string
  /** Valeur du compteur, plafonnée au seuil. */
  progress: number
  threshold: number
  unlocked: boolean
}

/** Compteurs d'un joueur qui n'a encore rien fait. */
export const EMPTY_STATS: Stats = { gamesPlayed: 0, gamesWon: 0, upgrades: 0, gold: 0 }

function statusOf(def: AchievementDef, stats: Stats): AchievementStatus {
  const value = stats[def.counter]
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    // Règle 5 : la progression ne dépasse jamais le seuil.
    progress: Math.min(value, def.threshold),
    threshold: def.threshold,
    // Règle 2 : obtenu dès que le compteur atteint le seuil.
    unlocked: value >= def.threshold,
  }
}

/**
 * Calcule l'état de tous les hauts faits d'un joueur à partir de ses compteurs.
 * Fonction pure : elle renvoie un état par définition (règle 4 : une fois par joueur),
 * et comme les compteurs ne font que croître, un haut fait obtenu le reste (règle 3).
 */
export function evaluate(stats: Stats): AchievementStatus[] {
  return ACHIEVEMENTS.map((def) => statusOf(def, stats))
}

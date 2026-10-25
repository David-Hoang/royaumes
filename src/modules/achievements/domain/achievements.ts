import { ACHIEVEMENTS, type AchievementDef, CATEGORIES, type Category, type Stats } from './catalog'

/** État d'un haut fait pour un joueur : sa progression, et s'il est obtenu. */
export interface AchievementStatus {
  id: string
  name: string
  description: string
  category: Category
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
    category: def.category,
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

/** Les hauts faits obtenus d'abord ; à égalité, l'ordre du catalogue est conservé. */
export function obtainedFirst(list: AchievementStatus[]): AchievementStatus[] {
  return [...list].sort((a, b) => Number(b.unlocked) - Number(a.unlocked))
}

/** Identifiants des hauts faits obtenus dans la liste actuelle, mais pas dans la précédente. */
export function newlyUnlocked(
  previous: ReadonlySet<string>,
  current: AchievementStatus[],
): string[] {
  return current.filter((a) => a.unlocked && !previous.has(a.id)).map((a) => a.id)
}

/**
 * Prochain objectif : le haut fait non obtenu le plus avancé, en proportion de son seuil.
 * À égalité, le premier du catalogue. Renvoie null quand tout est obtenu.
 */
export function nextGoal(list: AchievementStatus[]): AchievementStatus | null {
  let best: AchievementStatus | null = null
  for (const a of list) {
    if (a.unlocked) continue
    if (!best || a.progress / a.threshold > best.progress / best.threshold) best = a
  }
  return best
}

/**
 * Regroupe les hauts faits par thème, dans l'ordre des thèmes ; un thème sans haut fait est
 * omis. À l'intérieur d'un thème, l'ordre de la liste reçue est conservé.
 */
export function groupByCategory(
  list: AchievementStatus[],
): { category: Category; achievements: AchievementStatus[] }[] {
  return CATEGORIES.map((category) => ({
    category,
    achievements: list.filter((a) => a.category === category),
  })).filter((group) => group.achievements.length > 0)
}

/**
 * Contenu des Hauts faits : les compteurs suivis et la liste des distinctions.
 * Ce fichier ne contient que des données. Les règles qui les utilisent se trouvent dans
 * achievements.ts : ajouter ou rééquilibrer un haut fait ne demande de modifier qu'ici.
 */

/** Compteurs suivis pour chaque joueur. « as const » permet d'en déduire un type union. */
export const COUNTERS = ['gamesPlayed', 'gamesWon', 'upgrades', 'gold'] as const
export type Counter = (typeof COUNTERS)[number]

/** Valeur de chaque compteur d'un joueur. */
export type Stats = Record<Counter, number>

/** Définition d'un haut fait : un compteur à faire atteindre à un seuil. */
export interface AchievementDef {
  id: string
  name: string
  description: string
  counter: Counter
  threshold: number
}

/** Les hauts faits du jeu. Chaque identifiant est unique. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first-blood',
    name: 'Premier sang',
    description: 'Gagner une expédition.',
    counter: 'gamesWon',
    threshold: 1,
  },
  {
    id: 'veteran',
    name: 'Vétéran',
    description: 'Jouer 10 expéditions.',
    counter: 'gamesPlayed',
    threshold: 10,
  },
  {
    id: 'builder',
    name: 'Bâtisseur',
    description: 'Améliorer 5 fois les bâtiments de son village.',
    counter: 'upgrades',
    threshold: 5,
  },
  {
    id: 'fortune',
    name: 'Fortune',
    description: 'Rapporter 200 or des expéditions.',
    counter: 'gold',
    threshold: 200,
  },
]

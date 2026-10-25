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

/**
 * Thèmes des hauts faits : chacun a sa section à l'écran, dans cet ordre. Chaque thème porte
 * le nom d'une entité du thème graphique, qui fournit son icône et son libellé.
 */
export const CATEGORIES = ['village', 'dungeon', 'market'] as const
export type Category = (typeof CATEGORIES)[number]

/** Définition d'un haut fait : un compteur à faire atteindre à un seuil. */
export interface AchievementDef {
  id: string
  name: string
  description: string
  category: Category
  counter: Counter
  threshold: number
}

/** Les hauts faits du jeu. Chaque identifiant est unique. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first-blood',
    name: 'Premier sang',
    description: 'Gagner une expédition.',
    category: 'dungeon',
    counter: 'gamesWon',
    threshold: 1,
  },
  {
    id: 'veteran',
    name: 'Vétéran',
    description: 'Jouer 10 expéditions.',
    category: 'dungeon',
    counter: 'gamesPlayed',
    threshold: 10,
  },
  {
    id: 'builder',
    name: 'Bâtisseur',
    description: 'Améliorer 5 fois les bâtiments de son village.',
    category: 'village',
    counter: 'upgrades',
    threshold: 5,
  },
  {
    id: 'first-coins',
    name: 'Premières pièces',
    description: 'Rapporter 100 or des expéditions.',
    category: 'dungeon',
    counter: 'gold',
    threshold: 100,
  },
  {
    id: 'fortune',
    name: 'Fortune',
    description: 'Rapporter 200 or des expéditions.',
    category: 'dungeon',
    counter: 'gold',
    threshold: 200,
  },
  {
    id: 'big-fortune',
    name: 'Grosse fortune',
    description: 'Rapporter 500 or des expéditions.',
    category: 'dungeon',
    counter: 'gold',
    threshold: 500,
  },
  {
    id: 'treasurer',
    name: 'Trésorier',
    description: 'Rapporter 1000 or des expéditions.',
    category: 'dungeon',
    counter: 'gold',
    threshold: 1000,
  },
  {
    id: 'gold-king',
    name: "Roi de l'or",
    description: 'Rapporter 2000 or des expéditions.',
    category: 'dungeon',
    counter: 'gold',
    threshold: 2000,
  },
]

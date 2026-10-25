/**
 * Contenu des Hauts faits : les compteurs suivis et la liste des distinctions.
 * Ce fichier ne contient que des données. Les règles qui les utilisent se trouvent dans
 * achievements.ts : ajouter ou rééquilibrer un haut fait ne demande de modifier qu'ici.
 */

/** Compteurs suivis pour chaque joueur. « as const » permet d'en déduire un type union. */
export const COUNTERS = [
  'gamesPlayed',
  'gamesWon',
  'upgrades',
  'gold',
  // Plus haut niveau atteint par chaque bâtiment du Village ; 0 s'il n'a jamais été amélioré.
  'sawmillLevel',
  'quarryLevel',
  'mineLevel',
] as const
export type Counter = (typeof COUNTERS)[number]

/** Valeur de chaque compteur d'un joueur. */
export type Stats = Record<Counter, number>

/**
 * Thèmes des hauts faits : chacun a sa section à l'écran, dans cet ordre. Chaque thème porte
 * le nom d'une entité du thème graphique, qui fournit son icône et son libellé.
 */
export const CATEGORIES = ['village', 'dungeon', 'market'] as const
export type Category = (typeof CATEGORIES)[number]

/**
 * Séries : des hauts faits qui mesurent le même compteur à des paliers croissants. L'écran les
 * réunit dans une seule carte. Chaque série porte le nom d'une entité du thème graphique, qui
 * fournit son icône ; la valeur est le titre de la carte.
 */
export const SERIES = {
  sawmill: 'Scierie',
  quarry: 'Carrière',
  mine: 'Mine',
  gold: 'Or rapporté',
} as const
export type SeriesId = keyof typeof SERIES

/** Définition d'un haut fait : un compteur à faire atteindre à un seuil. */
export interface AchievementDef {
  id: string
  name: string
  description: string
  category: Category
  /** Série dont il est un palier ; absent pour un haut fait isolé. */
  series?: SeriesId
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
  // Trois paliers par bâtiment : une première amélioration (le compteur vaut 0 tant que le
  // bâtiment n'a jamais été amélioré), le niveau 5, puis le niveau maximal du Village.
  {
    id: 'sawmill-first',
    name: 'Premier coup de scie',
    description: 'Améliorer la scierie une première fois.',
    category: 'village',
    series: 'sawmill',
    counter: 'sawmillLevel',
    threshold: 1,
  },
  {
    id: 'sawmill-mid',
    name: 'Scierie solide',
    description: 'Amener la scierie au niveau 5.',
    category: 'village',
    series: 'sawmill',
    counter: 'sawmillLevel',
    threshold: 5,
  },
  {
    id: 'sawmill-max',
    name: 'Maître scieur',
    description: 'Amener la scierie au niveau 10, le maximum.',
    category: 'village',
    series: 'sawmill',
    counter: 'sawmillLevel',
    threshold: 10,
  },
  {
    id: 'quarry-first',
    name: 'Premier coup de pioche',
    description: 'Améliorer la carrière une première fois.',
    category: 'village',
    series: 'quarry',
    counter: 'quarryLevel',
    threshold: 1,
  },
  {
    id: 'quarry-mid',
    name: 'Carrière profonde',
    description: 'Amener la carrière au niveau 5.',
    category: 'village',
    series: 'quarry',
    counter: 'quarryLevel',
    threshold: 5,
  },
  {
    id: 'quarry-max',
    name: 'Maître carrier',
    description: 'Amener la carrière au niveau 10, le maximum.',
    category: 'village',
    series: 'quarry',
    counter: 'quarryLevel',
    threshold: 10,
  },
  {
    id: 'mine-first',
    name: 'Premier filon',
    description: 'Améliorer la mine une première fois.',
    category: 'village',
    series: 'mine',
    counter: 'mineLevel',
    threshold: 1,
  },
  {
    id: 'mine-mid',
    name: 'Mine prospère',
    description: 'Amener la mine au niveau 5.',
    category: 'village',
    series: 'mine',
    counter: 'mineLevel',
    threshold: 5,
  },
  {
    id: 'mine-max',
    name: 'Maître mineur',
    description: 'Amener la mine au niveau 10, le maximum.',
    category: 'village',
    series: 'mine',
    counter: 'mineLevel',
    threshold: 10,
  },
  {
    id: 'first-coins',
    name: 'Premières pièces',
    description: 'Rapporter 100 or des expéditions.',
    category: 'dungeon',
    series: 'gold',
    counter: 'gold',
    threshold: 100,
  },
  {
    id: 'fortune',
    name: 'Fortune',
    description: 'Rapporter 200 or des expéditions.',
    category: 'dungeon',
    series: 'gold',
    counter: 'gold',
    threshold: 200,
  },
  {
    id: 'big-fortune',
    name: 'Grosse fortune',
    description: 'Rapporter 500 or des expéditions.',
    category: 'dungeon',
    series: 'gold',
    counter: 'gold',
    threshold: 500,
  },
  {
    id: 'treasurer',
    name: 'Trésorier',
    description: 'Rapporter 1000 or des expéditions.',
    category: 'dungeon',
    series: 'gold',
    counter: 'gold',
    threshold: 1000,
  },
  {
    id: 'gold-king',
    name: "Roi de l'or",
    description: 'Rapporter 2000 or des expéditions.',
    category: 'dungeon',
    series: 'gold',
    counter: 'gold',
    threshold: 2000,
  },
]

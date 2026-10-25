/**
 * Couche de thème : l'apparence de chaque entité du jeu est définie ici, et nulle part ailleurs.
 * Les composants n'affichent jamais un symbole en dur : ils demandent l'apparence
 * d'une entité par son identifiant. Changer de direction artistique, par exemple
 * remplacer les symboles par des images, ne demande de modifier que ce fichier.
 */
export interface Look {
  /** Symbole affiché. */
  glyph: string
  /** Libellé en français, lu par les lecteurs d'écran et affiché au survol. */
  label: string
}

export const theme: Record<string, Look> = {
  village: { glyph: '🏰', label: 'Village' },
  wood: { glyph: '🪵', label: 'Bois' },
  stone: { glyph: '🪨', label: 'Pierre' },
  gold: { glyph: '🪙', label: 'Or' },
  sawmill: { glyph: '🪚', label: 'Scierie' },
  quarry: { glyph: '⛏️', label: 'Carrière' },
  mine: { glyph: '⚒️', label: 'Mine' },
  dungeon: { glyph: '⚔️', label: 'Donjon' },
  hero: { glyph: '🛡️', label: 'Héros' },
  companion: { glyph: '🤖', label: 'Compagnon' },
  goblin: { glyph: '👺', label: 'Gobelin' },
  skeleton: { glyph: '💀', label: 'Squelette' },
  troll: { glyph: '👹', label: 'Troll' },
  door: { glyph: '🚪', label: 'Porte' },
  ranking: { glyph: '🏆', label: 'Classement' },
  market: { glyph: '⚖️', label: 'Marché' },
  tavern: { glyph: '🍺', label: 'Taverne' },
  achievements: { glyph: '🎖️', label: 'Hauts faits' },
  'first-blood': { glyph: '🗡️', label: 'Premier sang' },
  veteran: { glyph: '🎖️', label: 'Vétéran' },
  builder: { glyph: '🔨', label: 'Bâtisseur' },
  'sawmill-first': { glyph: '🪚', label: 'Premier coup de scie' },
  'sawmill-mid': { glyph: '🪵', label: 'Scierie solide' },
  'sawmill-max': { glyph: '🌲', label: 'Maître scieur' },
  'quarry-first': { glyph: '⛏️', label: 'Premier coup de pioche' },
  'quarry-mid': { glyph: '🪨', label: 'Carrière profonde' },
  'quarry-max': { glyph: '🏔️', label: 'Maître carrier' },
  'mine-first': { glyph: '⚒️', label: 'Premier filon' },
  'mine-mid': { glyph: '💰', label: 'Mine prospère' },
  'mine-max': { glyph: '💎', label: 'Maître mineur' },
  'easy-companions': { glyph: '🤝', label: 'Facile, avec compagnons' },
  'easy-1': { glyph: '🤖', label: 'Bien entouré' },
  'easy-2': { glyph: '👥', label: 'Petite troupe' },
  'easy-3': { glyph: '🛡️', label: 'Escouade complète' },
  'hard-companions': { glyph: '🔥', label: 'Difficile, avec compagnons' },
  'hard-1': { glyph: '💪', label: 'Brave' },
  'hard-2': { glyph: '🐺', label: 'Chef de bande' },
  'hard-3': { glyph: '⚓', label: 'Capitaine' },
  'first-stall': { glyph: '🏪', label: 'Premier étal' },
  trades: { glyph: '📜', label: 'Offres réussies' },
  'trade-1': { glyph: '🤲', label: 'Premier échange' },
  'trade-5': { glyph: '📦', label: 'Négociant' },
  'trade-10': { glyph: '🧾', label: 'Commerçant' },
  'trade-25': { glyph: '🚢', label: 'Grand marchand' },
  fortune: { glyph: '💰', label: 'Fortune' },
  'first-coins': { glyph: '🪙', label: 'Premières pièces' },
  'big-fortune': { glyph: '💎', label: 'Grosse fortune' },
  treasurer: { glyph: '🏦', label: 'Trésorier' },
  'gold-king': { glyph: '👑', label: "Roi de l'or" },
}

/** Apparence d'une entité ; une apparence neutre si l'entité n'est pas décrite. */
export const look = (kind: string): Look => theme[kind] ?? { glyph: '?', label: kind }

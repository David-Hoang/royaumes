import { integer, pgSchema, primaryKey, text } from 'drizzle-orm/pg-core'

/** Schéma PostgreSQL du module Hauts faits : il ne contient que des modèles de lecture. */
export const achievements = pgSchema('achievements')

/** Compteurs de chaque joueur, tenus à jour par la projection des hauts faits. */
export const playerStats = achievements.table('player_stats', {
  playerId: text('player_id').primaryKey(),
  gamesPlayed: integer('games_played').notNull().default(0),
  gamesWon: integer('games_won').notNull().default(0),
  upgrades: integer('upgrades').notNull().default(0),
  gold: integer('gold').notNull().default(0),
  // Plus haut niveau atteint par chaque bâtiment, d'après l'événement BuildingUpgraded ;
  // 0 tant que le bâtiment n'a jamais été amélioré. Ajoutés par la version 2 de la projection.
  sawmillLevel: integer('sawmill_level').notNull().default(0),
  quarryLevel: integer('quarry_level').notNull().default(0),
  mineLevel: integer('mine_level').notNull().default(0),
})

/**
 * Joueurs de chaque expédition, retenus jusqu'à sa fin : l'événement GameEnded désigne
 * l'expédition, et cette table indique à quels joueurs attribuer son résultat.
 * Les compagnons n'y figurent pas, puisqu'ils n'arrivent pas par GameCreated ou PlayerJoined.
 */
export const gamePlayers = achievements.table(
  'game_players',
  {
    gameId: text('game_id').notNull(),
    playerId: text('player_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.playerId] })],
)

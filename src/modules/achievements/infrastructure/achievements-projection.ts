import { eq, inArray, sql } from 'drizzle-orm'
import { GAME_CHANNEL_PREFIX } from '@/modules/dungeon/contracts'
import { VILLAGE_CHANNEL_PREFIX } from '@/modules/realm/contracts'
import type { StoredEvent } from '@/platform/event-store/event-store'
import type { DbTransaction, Projection } from '@/platform/projection/projection'
import { gamePlayers, playerStats } from './schema'

/*
 * Données des événements lus par les Hauts faits. Elles forment le « langage publié »
 * du Village et du Donjon : le module en dépend, comme tout lecteur du journal.
 * Seuls les champs utiles sont décrits.
 */
interface GameCreatedData {
  hostId: string
}
interface PlayerJoinedData {
  playerId: string
}
interface GameEndedData {
  result: 'won' | 'lost'
  loot: number
}

/** Identifiant tiré du nom d'un flux : « dungeon-7f3a » donne « 7f3a ». */
const idFrom = (event: StoredEvent, prefix: string) => event.stream.slice(prefix.length)

/** Enregistre la participation d'un joueur à une expédition, et lui crée ses compteurs. */
async function recordPlayer(tx: DbTransaction, gameId: string, playerId: string) {
  await tx.insert(playerStats).values({ playerId }).onConflictDoNothing()
  await tx.insert(gamePlayers).values({ gameId, playerId }).onConflictDoNothing()
}

/**
 * Projection des hauts faits : met à jour les compteurs des joueurs à partir du journal.
 * Version 1 : première version.
 */
export const achievementsProjection: Projection = {
  name: 'achievements',
  version: 1,
  eventTypes: ['GameCreated', 'PlayerJoined', 'GameEnded', 'BuildingUpgraded'],

  async apply(event, tx) {
    switch (event.type) {
      case 'GameCreated': {
        const data = event.data as unknown as GameCreatedData
        await recordPlayer(tx, idFrom(event, GAME_CHANNEL_PREFIX), data.hostId)
        return
      }

      case 'PlayerJoined': {
        const data = event.data as unknown as PlayerJoinedData
        await recordPlayer(tx, idFrom(event, GAME_CHANNEL_PREFIX), data.playerId)
        return
      }

      case 'GameEnded': {
        // Le résultat est attribué aux joueurs de l'expédition, compagnons exclus.
        const data = event.data as unknown as GameEndedData
        const gameId = idFrom(event, GAME_CHANNEL_PREFIX)
        const rows = await tx.select().from(gamePlayers).where(eq(gamePlayers.gameId, gameId))
        const ids = rows.map((row) => row.playerId)
        if (ids.length > 0) {
          const won = data.result === 'won'
          await tx
            .update(playerStats)
            .set({
              gamesPlayed: sql`${playerStats.gamesPlayed} + 1`,
              gamesWon: sql`${playerStats.gamesWon} + ${won ? 1 : 0}`,
              gold: sql`${playerStats.gold} + ${won ? data.loot : 0}`,
            })
            .where(inArray(playerStats.playerId, ids))
        }
        // L'expédition est terminée : la liste de ses joueurs n'est plus utile.
        await tx.delete(gamePlayers).where(eq(gamePlayers.gameId, gameId))
        return
      }

      case 'BuildingUpgraded': {
        const playerId = idFrom(event, VILLAGE_CHANNEL_PREFIX)
        await tx
          .insert(playerStats)
          .values({ playerId, upgrades: 1 })
          .onConflictDoUpdate({
            target: playerStats.playerId,
            set: { upgrades: sql`${playerStats.upgrades} + 1` },
          })
        return
      }
    }
  },

  async reset(tx) {
    await tx.delete(gamePlayers)
    await tx.delete(playerStats)
  },
}

import { eq, inArray, sql } from 'drizzle-orm'
import { GAME_CHANNEL_PREFIX } from '@/modules/dungeon/contracts'
import { OFFER_STREAM_PREFIX } from '@/modules/market/contracts'
import { VILLAGE_CHANNEL_PREFIX } from '@/modules/realm/contracts'
import type { StoredEvent } from '@/platform/event-store/event-store'
import type { DbTransaction, Projection } from '@/platform/projection/projection'
import { gamePlayers, games, offers, playerStats } from './schema'

/*
 * Données des événements lus par les Hauts faits. Elles forment le « langage publié »
 * du Village et du Donjon : le module en dépend, comme tout lecteur du journal.
 * Seuls les champs utiles sont décrits.
 */
interface GameCreatedData {
  hostId: string
  /** Absente des expéditions enregistrées avant l'introduction des niveaux : facile. */
  difficulty?: string
}
interface PlayerJoinedData {
  playerId: string
}
interface GameEndedData {
  result: 'won' | 'lost'
  loot: number
}
interface OfferPublishedData {
  sellerId: string
}
interface BuildingUpgradedData {
  building?: string
  toLevel?: number
}

/** Colonne qui retient le plus haut niveau atteint par chaque bâtiment du Village. */
const LEVEL_KEYS = {
  sawmill: 'sawmillLevel',
  quarry: 'quarryLevel',
  mine: 'mineLevel',
} as const

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
 * Version 2 : ajout du plus haut niveau atteint par chaque bâtiment.
 * Version 3 : ajout des compagnons des expéditions gagnées, par niveau de difficulté.
 * Version 4 : ajout des offres publiées et des échanges conclus au Marché.
 */
export const achievementsProjection: Projection = {
  name: 'achievements',
  version: 4,
  eventTypes: [
    'GameCreated',
    'PlayerJoined',
    'CompanionAdded',
    'GameEnded',
    'BuildingUpgraded',
    'OfferPublished',
    'TradeCompleted',
    'OfferWithdrawn',
  ],

  async apply(event, tx) {
    switch (event.type) {
      case 'GameCreated': {
        const data = event.data as unknown as GameCreatedData
        const gameId = idFrom(event, GAME_CHANNEL_PREFIX)
        await recordPlayer(tx, gameId, data.hostId)
        await tx
          .insert(games)
          .values({ gameId, difficulty: data.difficulty === 'hard' ? 'hard' : 'easy' })
          .onConflictDoNothing()
        return
      }

      case 'CompanionAdded': {
        const gameId = idFrom(event, GAME_CHANNEL_PREFIX)
        await tx
          .update(games)
          .set({ companions: sql`${games.companions} + 1` })
          .where(eq(games.gameId, gameId))
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
        const [game] = await tx.select().from(games).where(eq(games.gameId, gameId))
        if (ids.length > 0) {
          const won = data.result === 'won'
          // Une expédition gagnée retient, par difficulté, le plus grand nombre de compagnons.
          const hard = game?.difficulty === 'hard'
          const key = hard ? 'hardCompanions' : 'easyCompanions'
          const bestCompanions =
            won && game ? { [key]: sql`greatest(${playerStats[key]}, ${game.companions})` } : {}
          await tx
            .update(playerStats)
            .set({
              gamesPlayed: sql`${playerStats.gamesPlayed} + 1`,
              gamesWon: sql`${playerStats.gamesWon} + ${won ? 1 : 0}`,
              gold: sql`${playerStats.gold} + ${won ? data.loot : 0}`,
              ...bestCompanions,
            })
            .where(inArray(playerStats.playerId, ids))
        }
        // L'expédition est terminée : ses joueurs et sa description ne sont plus utiles.
        await tx.delete(gamePlayers).where(eq(gamePlayers.gameId, gameId))
        await tx.delete(games).where(eq(games.gameId, gameId))
        return
      }

      case 'BuildingUpgraded': {
        const data = event.data as unknown as BuildingUpgradedData
        const playerId = idFrom(event, VILLAGE_CHANNEL_PREFIX)
        // Le niveau n'est retenu que pour un bâtiment connu ; l'amélioration est toujours comptée.
        const key =
          typeof data.toLevel === 'number'
            ? LEVEL_KEYS[data.building as keyof typeof LEVEL_KEYS]
            : undefined
        const firstLevel = key ? { [key]: data.toLevel } : {}
        const nextLevel = key ? { [key]: sql`greatest(${playerStats[key]}, ${data.toLevel})` } : {}
        await tx
          .insert(playerStats)
          .values({ playerId, upgrades: 1, ...firstLevel })
          .onConflictDoUpdate({
            target: playerStats.playerId,
            set: { upgrades: sql`${playerStats.upgrades} + 1`, ...nextLevel },
          })
        return
      }

      case 'OfferPublished': {
        // Le vendeur de l'offre est retenu : l'échange conclu lui sera attribué.
        const data = event.data as unknown as OfferPublishedData
        const offerId = idFrom(event, OFFER_STREAM_PREFIX)
        await tx.insert(offers).values({ offerId, sellerId: data.sellerId }).onConflictDoNothing()
        await tx
          .insert(playerStats)
          .values({ playerId: data.sellerId, offersPublished: 1 })
          .onConflictDoUpdate({
            target: playerStats.playerId,
            set: { offersPublished: sql`${playerStats.offersPublished} + 1` },
          })
        return
      }

      case 'TradeCompleted': {
        // L'échange réussi est attribué au vendeur de l'offre ; l'offre est alors terminée.
        // DETTE TECHNIQUE (docs/qualite/dette-technique.md, DT-015) : un échange entre deux
        // comptes d'un même joueur est compté comme n'importe quel autre.
        const offerId = idFrom(event, OFFER_STREAM_PREFIX)
        const [offer] = await tx.select().from(offers).where(eq(offers.offerId, offerId))
        if (offer) {
          await tx
            .update(playerStats)
            .set({ tradesCompleted: sql`${playerStats.tradesCompleted} + 1` })
            .where(eq(playerStats.playerId, offer.sellerId))
          await tx.delete(offers).where(eq(offers.offerId, offerId))
        }
        return
      }

      case 'OfferWithdrawn': {
        // Une offre retirée ou échue n'aboutira pas : son vendeur n'a plus à être retenu.
        const offerId = idFrom(event, OFFER_STREAM_PREFIX)
        await tx.delete(offers).where(eq(offers.offerId, offerId))
        return
      }
    }
  },

  async reset(tx) {
    await tx.delete(offers)
    await tx.delete(games)
    await tx.delete(gamePlayers)
    await tx.delete(playerStats)
  },
}

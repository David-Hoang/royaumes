import type { Stats } from '../domain/catalog'

/**
 * Port de lecture des compteurs d'un joueur, défini par la couche application.
 * Le module n'a aucune commande : il ne fait que lire un modèle de lecture.
 */
export interface StatsReader {
  /**
   * Compteurs d'un joueur, à jour au moment de l'appel, et position du journal atteinte.
   * Un joueur inconnu a tous ses compteurs à zéro.
   */
  statsOf(playerId: string): Promise<{ position: number; stats: Stats }>
}

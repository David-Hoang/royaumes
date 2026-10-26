import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { hasVillage } from './server'

/**
 * Garde des pages du jeu : tant que le joueur n'a pas fondé son village, il est renvoyé vers
 * l'écran du Village, où il le fonde. À appeler au début de chaque page, sauf celle du Village
 * et celle des données personnelles. En cas d'échec de la lecture, la page reste accessible.
 */
export async function requireVillage() {
  if (!(await hasVillage(await headers()))) redirect('/village')
}

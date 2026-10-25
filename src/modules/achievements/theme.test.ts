import { describe, expect, it } from 'vitest'
import { theme } from '@/ui/theme'
import { ACHIEVEMENTS, CATEGORIES, SERIES } from './domain/catalog'

/**
 * Fonction d'aptitude du module : l'écran demande l'apparence de chaque haut fait, de chaque
 * série et de chaque thème au thème graphique, qui renvoie un point d'interrogation pour une
 * entité qu'il ne connaît pas. Ajouter un haut fait sans son icône doit faire échouer ce test.
 */
describe('Apparence des hauts faits dans le thème graphique', () => {
  it('décrit chaque haut fait', () => {
    const missing = ACHIEVEMENTS.map((def) => def.id).filter((id) => !(id in theme))
    expect(missing).toEqual([])
  })

  it('décrit chaque série', () => {
    const missing = Object.keys(SERIES).filter((id) => !(id in theme))
    expect(missing).toEqual([])
  })

  it('décrit chaque thème', () => {
    const missing = CATEGORIES.filter((id) => !(id in theme))
    expect(missing).toEqual([])
  })

  it('ne réutilise pas un identifiant de haut fait pour une autre entité du jeu', () => {
    const ids = [...ACHIEVEMENTS.map((def) => def.id), ...Object.keys(SERIES)]
    expect(new Set(ids).size).toBe(ids.length)
  })
})

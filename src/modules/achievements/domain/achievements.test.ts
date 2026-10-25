import { describe, expect, it } from 'vitest'
import { EMPTY_STATS, evaluate, newlyUnlocked, nextGoal, obtainedFirst } from './achievements'
import { ACHIEVEMENTS, type Stats } from './catalog'

/** Compteurs d'un joueur, avec quelques valeurs modifiées. */
const stats = (changes: Partial<Stats>): Stats => ({ ...EMPTY_STATS, ...changes })

/** État d'un haut fait précis. */
const statusOf = (s: Stats, id: string) => {
  const status = evaluate(s).find((a) => a.id === id)
  if (!status) throw new Error(`Haut fait inconnu : ${id}`)
  return status
}

describe('Hauts faits', () => {
  // Règle 1 : un haut fait est un compteur et un seuil.
  it('définit chaque haut fait par un compteur et un seuil positif', () => {
    for (const def of ACHIEVEMENTS) {
      expect(def.counter).toBeTruthy()
      expect(def.threshold).toBeGreaterThan(0)
    }
  })

  // Règle 2 : obtenu dès que le compteur atteint le seuil.
  it("n'accorde rien à un joueur qui n'a rien fait", () => {
    expect(evaluate(EMPTY_STATS).every((a) => !a.unlocked)).toBe(true)
  })

  it('accorde un haut fait dès que le compteur atteint le seuil, et pas avant', () => {
    expect(statusOf(stats({ upgrades: 4 }), 'builder').unlocked).toBe(false)
    expect(statusOf(stats({ upgrades: 5 }), 'builder').unlocked).toBe(true)
  })

  // Règle 3 : jamais retiré.
  it('ne retire jamais un haut fait quand les compteurs augmentent', () => {
    const before = evaluate(stats({ gamesWon: 1, upgrades: 5 }))
    const after = evaluate(stats({ gamesWon: 3, upgrades: 9, gold: 50 }))
    for (const a of before.filter((s) => s.unlocked)) {
      expect(after.find((s) => s.id === a.id)?.unlocked).toBe(true)
    }
  })

  // Règle 4 : une fois par joueur.
  it('renvoie un seul état par haut fait, avec des identifiants uniques', () => {
    const ids = evaluate(stats({ gamesWon: 100, gold: 9999 })).map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(ACHIEVEMENTS.length)
  })

  // Règle 5 : progression plafonnée au seuil.
  it('mesure la progression par le compteur, plafonnée au seuil', () => {
    expect(statusOf(stats({ gold: 50 }), 'fortune').progress).toBe(50)
    expect(statusOf(stats({ gold: 5000 }), 'fortune').progress).toBe(200)
  })
})

describe('Présentation des hauts faits', () => {
  it("place les hauts faits obtenus en premier, en gardant l'ordre du catalogue", () => {
    const list = evaluate(stats({ upgrades: 5, gold: 200 }))
    expect(obtainedFirst(list).map((a) => a.id)).toEqual([
      'builder',
      'fortune',
      'first-blood',
      'veteran',
    ])
  })

  it('repère les hauts faits obtenus depuis la lecture précédente', () => {
    const list = evaluate(stats({ gamesWon: 1, upgrades: 5 }))
    expect(newlyUnlocked(new Set(['first-blood']), list)).toEqual(['builder'])
  })

  it("ne repère rien quand rien n'a changé", () => {
    const list = evaluate(stats({ gamesWon: 1 }))
    expect(newlyUnlocked(new Set(['first-blood']), list)).toEqual([])
  })

  it('propose comme prochain objectif le haut fait non obtenu le plus avancé', () => {
    // Vétéran : 9 sur 10 ; Bâtisseur : 1 sur 5 ; Fortune : 0 sur 200.
    const list = evaluate(stats({ gamesWon: 1, gamesPlayed: 9, upgrades: 1 }))
    expect(nextGoal(list)?.id).toBe('veteran')
  })

  it('ne propose aucun objectif quand tout est obtenu', () => {
    const all = evaluate(stats({ gamesPlayed: 10, gamesWon: 1, upgrades: 5, gold: 200 }))
    expect(nextGoal(all)).toBeNull()
  })
})

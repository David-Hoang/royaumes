import { describe, expect, it } from 'vitest'
import {
  EMPTY_STATS,
  evaluate,
  groupByCategory,
  groupBySeries,
  newlyUnlocked,
  nextGoal,
} from './achievements'
import { ACHIEVEMENTS, CATEGORIES, type Stats } from './catalog'

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
    const all = evaluate(
      stats({
        gamesPlayed: 10,
        gamesWon: 1,
        upgrades: 5,
        gold: 2000,
        sawmillLevel: 10,
        quarryLevel: 10,
        mineLevel: 10,
        easyCompanions: 3,
        hardCompanions: 3,
      }),
    )
    expect(nextGoal(all)).toBeNull()
  })
})

describe('Thèmes des hauts faits', () => {
  it('range chaque haut fait dans un thème connu', () => {
    for (const def of ACHIEVEMENTS) expect(CATEGORIES).toContain(def.category)
  })

  it("regroupe les hauts faits par thème, dans l'ordre des thèmes, sans thème vide", () => {
    const groups = groupByCategory(evaluate(EMPTY_STATS))
    const used = CATEGORIES.filter((c) => ACHIEVEMENTS.some((def) => def.category === c))
    expect(groups.map((g) => g.category)).toEqual(used)
  })

  it('place chaque haut fait dans un seul groupe', () => {
    const ids = groupByCategory(evaluate(EMPTY_STATS)).flatMap((g) =>
      g.achievements.map((a) => a.id),
    )
    expect(ids.sort()).toEqual(ACHIEVEMENTS.map((def) => def.id).sort())
  })
})

describe('Séries de hauts faits', () => {
  // Une série se lit comme une seule jauge : tous ses paliers mesurent le même compteur, dans
  // le même thème.
  it("fait mesurer à tous les paliers d'une série le même compteur, dans le même thème", () => {
    for (const id of new Set(ACHIEVEMENTS.map((def) => def.series).filter(Boolean))) {
      const tiers = ACHIEVEMENTS.filter((def) => def.series === id)
      expect(new Set(tiers.map((t) => t.counter)).size).toBe(1)
      expect(new Set(tiers.map((t) => t.category)).size).toBe(1)
    }
  })

  it('réunit les paliers de la scierie en une carte, du plus bas au plus haut', () => {
    const entries = groupBySeries(evaluate(EMPTY_STATS))
    const sawmill = entries.find((e) => e.kind === 'series' && e.id === 'sawmill')
    expect(sawmill?.kind === 'series' && sawmill.tiers.map((t) => t.id)).toEqual([
      'sawmill-first',
      'sawmill-mid',
      'sawmill-max',
    ])
  })

  it('laisse un haut fait isolé seul, et ne perd ni ne duplique aucun haut fait', () => {
    const entries = groupBySeries(evaluate(EMPTY_STATS))
    expect(entries.some((e) => e.kind === 'single' && e.achievement.id === 'first-blood')).toBe(
      true,
    )
    const ids = entries.flatMap((e) =>
      e.kind === 'single' ? [e.achievement.id] : e.tiers.map((t) => t.id),
    )
    expect(ids.sort()).toEqual(ACHIEVEMENTS.map((def) => def.id).sort())
  })
})

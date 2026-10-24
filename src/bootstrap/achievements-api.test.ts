import { describe, expect, it } from 'vitest'
import type { AchievementStatus, PlayerAchievements } from '@/modules/achievements/contracts'
import { createTestApi } from './testing'

type TestApi = Awaited<ReturnType<typeof createTestApi>>

/** Hauts faits d'un joueur, tels que l'API les renvoie. */
async function achievementsOf({ get }: TestApi, user = 'alice') {
  const res = await get('/api/achievements', user)
  return ((await res.json()) as PlayerAchievements).achievements
}

/** État d'un haut fait précis. */
const find = (list: AchievementStatus[], id: string) => list.find((a) => a.id === id)

describe('API du module Hauts faits', () => {
  it('refuse une requête anonyme (401)', async () => {
    const api = await createTestApi()
    expect((await api.get('/api/achievements', null)).status).toBe(401)
  })

  it("présente la progression d'après l'activité du Village et du Donjon", async () => {
    const api = await createTestApi()
    // Village : fondation, puis une amélioration une heure plus tard.
    await api.post('/api/realm/village', { name: 'Valombre' })
    api.advance(60)
    await api.post('/api/realm/village/upgrade', { building: 'sawmill' })
    // Donjon : une expédition en solo, abandonnée pendant une heure, donc perdue.
    const { gameId } = await (await api.post('/api/dungeon/games', {})).json()
    await api.post(`/api/dungeon/games/${gameId}/start`, {})
    api.advance(60)
    await api.post(`/api/dungeon/games/${gameId}/deadline`, {})

    const list = await achievementsOf(api)
    expect(find(list, 'builder')).toMatchObject({ progress: 1, unlocked: false })
    expect(find(list, 'veteran')).toMatchObject({ progress: 1, unlocked: false })
    expect(find(list, 'first-blood')).toMatchObject({ progress: 0, unlocked: false })
  })

  it('ne présente à un joueur que ses propres hauts faits', async () => {
    const api = await createTestApi()
    // Alice joue une expédition en solo, abandonnée pendant une heure, donc perdue.
    const { gameId } = await (await api.post('/api/dungeon/games', {}, 'alice')).json()
    await api.post(`/api/dungeon/games/${gameId}/start`, {}, 'alice')
    api.advance(60)
    await api.post(`/api/dungeon/games/${gameId}/deadline`, {}, 'alice')
    expect(find(await achievementsOf(api, 'alice'), 'veteran')?.progress).toBe(1)

    // Bob n'a rien fait : tous ses compteurs sont à zéro, quoi qu'ait fait alice.
    const bob = await achievementsOf(api, 'bob')
    expect(bob.every((a) => a.progress === 0 && !a.unlocked)).toBe(true)
  })

  it('annonce sur son canal les événements lus, sans leurs données', async () => {
    const api = await createTestApi()
    await api.post('/api/dungeon/games', {})

    const res = await api.get('/api/stream/achievements/events?after=0')
    const { events } = (await res.json()) as { events: { type: string }[] }
    expect(events.map((event) => event.type)).toEqual(['GameCreated'])
    // La graine de l'expédition, présente dans l'événement GameCreated, n'est pas transmise.
    expect(JSON.stringify(events)).not.toContain('seed')
  })
})

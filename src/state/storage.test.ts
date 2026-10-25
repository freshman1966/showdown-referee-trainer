import { describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../config'
import { emptyProgress } from './progress'
import { createStore, parseProgress } from './storage'

describe('parseProgress', () => {
  it('falls back to defaults for missing, broken or foreign data', () => {
    expect(parseProgress(null)).toEqual(emptyProgress())
    expect(parseProgress('{oops')).toEqual(emptyProgress())
    expect(parseProgress('{"v":2}')).toEqual(emptyProgress())
  })

  it('drops invalid fields and keeps valid ones', () => {
    const p = parseProgress(JSON.stringify({ v: 1, passed: ['p/trainee', 3], settings: { timer: 30, theme: 'dark' } }))
    expect(p.passed).toEqual(['p/trainee'])
    expect(p.settings).toMatchObject({ timer: 0, theme: 'dark', sound: false })
  })
})

describe('createStore', () => {
  it('round-trips through localStorage', () => {
    const store = createStore()
    expect(store.available).toBe(true)
    const p = { ...emptyProgress(), passed: ['p/trainee'] }
    store.save(p)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).passed).toEqual(['p/trainee'])
    expect(createStore().load()).toEqual(p)
  })

  it('works without storage', () => {
    const store = createStore(() => {
      throw new Error('blocked')
    })
    expect(store.available).toBe(false)
    expect(store.load()).toEqual(emptyProgress())
    expect(() => store.save(emptyProgress())).not.toThrow()
  })
})

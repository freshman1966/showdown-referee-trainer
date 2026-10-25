import { describe, expect, it } from 'vitest'
import { makeQuestion } from '../test/fixtures'
import type { PackMeta } from '../content/types'
import type { Run } from '../game/run'
import { applyRun, emptyProgress, levelState, resetProgress } from './progress'

const meta: PackMeta = { id: 'p', title: { en: 'P' }, edition: '2026-2028', levels: ['trainee', 'national', 'international'], defaultLocale: 'en' }
const questions = Array.from({ length: 12 }, () => makeQuestion())

function run(correctCount: number, kind: Run['kind'] = 'level'): Run {
  return {
    kind,
    packId: 'p',
    levelId: kind === 'level' ? 'trainee' : null,
    items: questions.map((question) => ({ question, optionOrder: ['a', 'b', 'c'] })),
    answers: questions.map((_, i) => (i < correctCount ? { selected: ['a'], correct: true } : { selected: ['b'], correct: false })),
  }
}

describe('levelState', () => {
  it('opens the first level, locks the rest, marks empty levels as coming soon', () => {
    const p = emptyProgress()
    expect(levelState(p, meta, 'trainee', 20)).toBe('unlocked')
    expect(levelState(p, meta, 'national', 20)).toBe('locked')
    expect(levelState(p, meta, 'international', 0)).toBe('comingSoon')
  })
})

describe('applyRun', () => {
  it('passes with 10 of 12, unlocks the next level and awards the level badge', () => {
    const { progress, outcome } = applyRun(emptyProgress(), run(10), meta, questions)
    expect(outcome).toMatchObject({ passed: true, newBest: false, unlockedLevel: 'national', newBadges: ['trainee'] })
    expect(levelState(progress, meta, 'trainee', 12)).toBe('passed')
    expect(levelState(progress, meta, 'national', 12)).toBe('unlocked')
    expect(progress.best['p/trainee']).toMatchObject({ player: 20, rulebook: 4 })
    expect(progress.wrongIds).toEqual(questions.slice(10).map((q) => q.id))
  })

  it('does not pass with 9 of 12', () => {
    const { progress, outcome } = applyRun(emptyProgress(), run(9), meta, questions)
    expect(outcome.passed).toBe(false)
    expect(outcome.unlockedLevel).toBeNull()
    expect(levelState(progress, meta, 'national', 12)).toBe('locked')
  })

  it('awards clean sheet and rulebook for a perfect run over the whole pool', () => {
    const { outcome } = applyRun(emptyProgress(), run(12), meta, questions)
    expect(outcome.newBadges).toEqual(['trainee', 'cleanSheet', 'rulebook'])
  })

  it('reports a new best only when it beats an earlier score', () => {
    const first = applyRun(emptyProgress(), run(10), meta, questions)
    const second = applyRun(first.progress, run(11), meta, questions)
    expect(second.outcome.newBest).toBe(true)
    expect(second.progress.best['p/trainee'].player).toBe(22)
  })

  it('keeps the best score and does not repeat badges', () => {
    const first = applyRun(emptyProgress(), run(12), meta, questions)
    const second = applyRun(first.progress, run(10), meta, questions)
    expect(second.outcome).toMatchObject({ newBest: false, newBadges: [], unlockedLevel: null })
    expect(second.progress.best['p/trainee'].player).toBe(24)
  })

  it('clears a wrong answer once it is answered correctly', () => {
    const first = applyRun(emptyProgress(), run(0), meta, questions)
    expect(first.progress.wrongIds).toHaveLength(12)
    const second = applyRun(first.progress, run(12), meta, questions)
    expect(second.progress.wrongIds).toEqual([])
  })

  it('ignores practice runs', () => {
    const before = emptyProgress()
    const { progress } = applyRun(before, run(12, 'practice'), meta, questions)
    expect(progress).toBe(before)
  })

  it('reset keeps settings only', () => {
    const { progress } = applyRun(emptyProgress(), run(12), meta, questions)
    const withSettings = { ...progress, settings: { ...progress.settings, timer: 45 as const } }
    expect(resetProgress(withSettings)).toEqual({ ...emptyProgress(), settings: withSettings.settings })
  })
})

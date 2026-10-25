import { describe, expect, it } from 'vitest'
import { makeQuestion, seeded } from '../test/fixtures'
import type { Topic } from '../content/types'
import { drawRun, weight } from './draw'

const TOPICS: Topic[] = ['serve', 'faults', 'goal-area', 'time-outs', 'signals']

function pool(size: number) {
  return Array.from({ length: size }, (_, i) =>
    makeQuestion({
      topics: [TOPICS[i % TOPICS.length]],
      difficulty: ((i % 3) + 1) as 1 | 2 | 3,
      importance: i % 2 ? 'critical' : 'standard',
    }),
  )
}

describe('weight', () => {
  it('follows spec 3.1a', () => {
    const none = new Set<string>()
    expect(weight(makeQuestion({ importance: 'standard', frequency: 'common' }), none)).toBe(1)
    expect(weight(makeQuestion({ importance: 'critical', frequency: 'common' }), none)).toBe(2)
    expect(weight(makeQuestion({ importance: 'critical', frequency: 'rare' }), none)).toBe(3)
    const q = makeQuestion({ importance: 'standard', frequency: 'rare' })
    expect(weight(q, new Set([q.id]))).toBe(4)
  })
})

describe('drawRun', () => {
  it('draws the requested number of distinct questions', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const run = drawRun(pool(20), 12, new Set(), seeded(seed))
      expect(run).toHaveLength(12)
      expect(new Set(run.map((r) => r.question.id)).size).toBe(12)
    }
  })

  it('covers every primary topic of the pool', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const run = drawRun(pool(20), 12, new Set(), seeded(seed))
      expect(new Set(run.map((r) => r.question.topics[0]))).toEqual(new Set(TOPICS))
    }
  })

  it('orders by difficulty, easier first', () => {
    const run = drawRun(pool(20), 12, new Set(), seeded(7))
    const d = run.map((r) => r.question.difficulty)
    expect(d).toEqual([...d].sort())
  })

  it('returns the whole pool when it is smaller than the run', () => {
    expect(drawRun(pool(5), 12, new Set(), seeded(1))).toHaveLength(5)
  })

  it('keeps option order for fixedOrder questions and shuffles the others', () => {
    const options = 'abcdef'.split('').map((id) => ({ id, text: id }))
    const fixed = makeQuestion({ fixedOrder: true, options })
    const free = makeQuestion({ options })
    const orders = new Set<string>()
    for (let seed = 1; seed <= 20; seed++) {
      const run = drawRun([fixed, free], 2, new Set(), seeded(seed))
      expect(run.find((r) => r.question === fixed)!.optionOrder.join('')).toBe('abcdef')
      orders.add(run.find((r) => r.question === free)!.optionOrder.join(''))
    }
    expect(orders.size).toBeGreaterThan(1)
  })

  it('prefers questions answered wrong before', () => {
    const questions = pool(20).map((q) => ({ ...q, topics: ['serve' as Topic], importance: 'standard' as const }))
    const wrong = new Set(questions.slice(0, 5).map((q) => q.id))
    let hits = 0
    for (let seed = 1; seed <= 200; seed++) {
      hits += drawRun(questions, 1, wrong, seeded(seed)).filter((r) => wrong.has(r.question.id)).length
    }
    // Weight 3 vs 1: expected share 15/30 = 50 %, against 25 % unweighted.
    expect(hits / 200).toBeGreaterThan(0.4)
  })
})

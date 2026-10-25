import type { Question } from '../content/types'

let n = 0
export function makeQuestion(overrides: Partial<Question> = {}): Question {
  n++
  return {
    id: `T-${String(n).padStart(3, '0')}`,
    level: 'trainee',
    topics: ['serve'],
    importance: 'standard',
    frequency: 'common',
    type: 'single',
    difficulty: 1,
    edition: '2026-2028',
    status: 'approved',
    prompt: `Question ${n}?`,
    scenario: null,
    options: [
      { id: 'a', text: 'Option A' },
      { id: 'b', text: 'Option B' },
      { id: 'c', text: 'Option C' },
    ],
    correct: ['a'],
    fixedOrder: false,
    explanation: 'Because.',
    ruleRefs: ['1'],
    media: null,
    requiresVision: false,
    reviewNote: null,
    ...overrides,
  }
}

/** Deterministic PRNG (mulberry32) for repeatable draws. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

import { describe, expect, it } from 'vitest'
import { isCorrect, score, streak } from './run'

describe('isCorrect', () => {
  it('is all-or-nothing', () => {
    expect(isCorrect(['a'], ['a'])).toBe(true)
    expect(isCorrect(['b', 'a'], ['a', 'b'])).toBe(true)
    expect(isCorrect(['a'], ['a', 'b'])).toBe(false)
    expect(isCorrect(['a', 'b', 'c'], ['a', 'b'])).toBe(false)
    expect(isCorrect([], ['a'])).toBe(false)
    expect(isCorrect(null, ['a'])).toBe(false)
  })
})

describe('score and streak', () => {
  const right = { selected: ['a'], correct: true }
  const wrong = { selected: ['b'], correct: false }
  it('scores 2 points per answer (spec 3.3)', () => {
    expect(score([...Array(10).fill(right), wrong, wrong])).toEqual({ player: 20, rulebook: 4 })
  })
  it('counts correct answers in a row from the latest', () => {
    expect(streak([right, wrong, right, right, right])).toBe(3)
    expect(streak([right, right, wrong])).toBe(0)
    expect(streak([])).toBe(0)
  })
})

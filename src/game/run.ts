import { PASS_MARK, POINTS_PER_ANSWER } from '../config'
import type { LevelId } from '../content/types'
import type { DrawnQuestion } from './draw'

export interface Answer {
  /** null when the timer ran out. */
  selected: string[] | null
  correct: boolean
}

export interface Run {
  kind: 'level' | 'practice'
  packId: string
  /** Level of a level run; null for practice. */
  levelId: LevelId | null
  items: DrawnQuestion[]
  answers: Answer[]
}

/** All-or-nothing: the selected set must equal the correct set (spec 3.3). */
export function isCorrect(selected: readonly string[] | null, correct: readonly string[]): boolean {
  if (!selected || selected.length !== correct.length) return false
  const set = new Set(selected)
  return correct.every((id) => set.has(id))
}

export function score(answers: readonly Answer[]): { player: number; rulebook: number } {
  const right = answers.filter((a) => a.correct).length
  return { player: right * POINTS_PER_ANSWER, rulebook: (answers.length - right) * POINTS_PER_ANSWER }
}

/** Number of correct answers in a row, counted back from the latest answer. */
export function streak(answers: readonly Answer[]): number {
  let n = 0
  for (let i = answers.length - 1; i >= 0 && answers[i].correct; i--) n++
  return n
}

export function correctCount(answers: readonly Answer[]): number {
  return answers.filter((a) => a.correct).length
}

export function isPassed(run: Run): boolean {
  return run.kind === 'level' && correctCount(run.answers) >= Math.min(PASS_MARK, run.items.length)
}

export function isFinished(run: Run): boolean {
  return run.answers.length >= run.items.length
}

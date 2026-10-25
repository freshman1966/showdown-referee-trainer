import type { Question } from '../content/types'

export type Rng = () => number

export interface DrawnQuestion {
  question: Question
  /** Option ids in display order. */
  optionOrder: string[]
}

/** Draw weight (spec 3.1a): critical 2, standard 1; rare +1; answered wrong before and not yet correct +2. */
export function weight(q: Question, wrongIds: ReadonlySet<string>): number {
  return (q.importance === 'critical' ? 2 : 1) + (q.frequency === 'rare' ? 1 : 0) + (wrongIds.has(q.id) ? 2 : 0)
}

function pickWeighted<T>(items: T[], weightOf: (item: T) => number, rng: Rng): number {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weightOf(items[i])
    if (r < 0) return i
  }
  return items.length - 1
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Draws `count` questions from `pool` (spec 3.1, 3.1a):
 * weighted without replacement, at least one question per primary topic where possible,
 * ordered by difficulty (easier first), options shuffled unless `fixedOrder`.
 */
export function drawRun(
  pool: readonly Question[],
  count: number,
  wrongIds: ReadonlySet<string>,
  rng: Rng = Math.random,
): DrawnQuestion[] {
  const remaining = [...pool]
  const chosen: Question[] = []
  const w = (q: Question) => weight(q, wrongIds)
  const take = (candidates: Question[]) => {
    const q = candidates[pickWeighted(candidates, w, rng)]
    remaining.splice(remaining.indexOf(q), 1)
    chosen.push(q)
  }

  const topics = shuffle([...new Set(pool.map((q) => q.topics[0]))], rng)
  for (const topic of topics) {
    if (chosen.length >= count) break
    take(remaining.filter((q) => q.topics[0] === topic))
  }
  while (chosen.length < count && remaining.length > 0) take(remaining)

  // Stable sort keeps the random order within the same difficulty.
  const ordered = shuffle(chosen, rng).sort((a, b) => a.difficulty - b.difficulty)
  return ordered.map((question) => ({
    question,
    optionOrder: question.fixedOrder
      ? question.options.map((o) => o.id)
      : shuffle(question.options.map((o) => o.id), rng),
  }))
}

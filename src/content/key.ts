import type { Question } from './types.ts'

/** Question key "N-024 v2" (spec 13.1). Comments and the question lock refer to it. */
export function questionKey(q: Pick<Question, 'id' | 'version'>): string {
  return `${q.id} v${q.version}`
}

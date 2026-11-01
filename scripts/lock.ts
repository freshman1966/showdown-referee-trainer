// Question lock (spec 13.1). Run: npm run content:lock
// One SHA-256 hash per question key over the player-visible fields. A text change
// without a version increase changes the hash under an existing key; the validator rejects that.
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readRawPacks } from './content.ts'
import { questionKey } from '../src/content/key.ts'
import type { PackMeta, Question } from '../src/content/types.ts'

export { questionKey }

export const LOCK_FILE = 'question-lock.json'

/** Fields whose change requires a new question version. */
export const VERSIONED_FIELDS = ['prompt', 'scenario', 'options', 'correct', 'explanation', 'interpretation', 'ruleRefs'] as const

export type Lock = Record<string, string>

/** JSON with object keys sorted at every level, so key order in the source file does not matter. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function questionHash(q: Question): string {
  // A missing optional field hashes like null, so adding "interpretation": null changes nothing.
  const fields = Object.fromEntries(VERSIONED_FIELDS.map((f) => [f, q[f] ?? null]))
  return createHash('sha256').update(canonical(fields)).digest('hex')
}

/** Adds hashes for keys not yet in the lock; existing keys are never overwritten. */
export function extendLock(lock: Lock, questions: Question[]): { lock: Lock; added: string[] } {
  const next = { ...lock }
  const added: string[] = []
  for (const q of questions) {
    const key = questionKey(q)
    if (key in next) continue
    next[key] = questionHash(q)
    added.push(key)
  }
  const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })))
  return { lock: sorted, added }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const raw of readRawPacks()) {
    const meta = raw.meta as PackMeta
    const questions = raw.questions[meta.defaultLocale] as Question[]
    const { lock, added } = extendLock(raw.lock ?? {}, questions)
    writeFileSync(join(raw.dir, LOCK_FILE), `${JSON.stringify(lock, null, 2)}\n`)
    console.log(`content:lock ${meta.id}: ${added.length} key(s) added, ${Object.keys(lock).length} locked`)
  }
}

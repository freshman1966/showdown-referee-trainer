// Question export for the review sheet (spec 13.4). Run: npm run export:questions
// Writes exports/questions-<contentVersion>.csv per pack: UTF-8, comma-separated, RFC 4180 quoting.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readRawPacks, readUiStrings } from './content.ts'
import { questionKey } from './lock.ts'
import { validateContent } from './validate.ts'
import type { PackMeta, Question } from '../src/content/types.ts'

export const EXPORT_DIR = join(import.meta.dirname, '..', 'exports')

export const COLUMNS = [
  'key', 'id', 'version', 'setVersion', 'level', 'topics', 'status', 'scenario',
  'prompt', 'options', 'correct', 'explanation', 'interpretation', 'ruleRefs',
] as const

function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function questionRow(q: Question, setVersion: string): string[] {
  const optionText = new Map(q.options.map((o) => [o.id, o.text]))
  const row: Record<(typeof COLUMNS)[number], string> = {
    key: questionKey(q),
    id: q.id,
    version: String(q.version),
    setVersion,
    level: q.level,
    topics: q.topics.join('; '),
    status: q.status,
    scenario: q.scenario ?? '',
    prompt: q.prompt,
    options: q.options.map((o) => `${o.id}) ${o.text}`).join('\n'),
    correct: q.correct.map((id) => optionText.get(id) ?? id).join('\n'),
    explanation: q.explanation,
    interpretation: q.interpretation ?? '',
    ruleRefs: q.ruleRefs.join('; '),
  }
  return COLUMNS.map((c) => row[c])
}

export function csvLine(cells: readonly string[]): string {
  return cells.map(cell).join(',')
}

export function questionsCsv(questions: Question[], setVersion: string): string {
  const lines = [COLUMNS as readonly string[], ...questions.map((q) => questionRow(q, setVersion))]
  return lines.map(csvLine).join('\r\n') + '\r\n'
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const packs = readRawPacks()
  const { errors } = validateContent(structuredClone(packs), readUiStrings(), 'preview')
  if (errors.length > 0) {
    for (const e of errors) console.error(`error: ${e}`)
    console.error('export:questions: content is invalid, nothing exported')
    process.exit(1)
  }
  mkdirSync(EXPORT_DIR, { recursive: true })
  for (const raw of packs) {
    const meta = raw.meta as PackMeta
    const questions = raw.questions[meta.defaultLocale] as Question[]
    const file = join(EXPORT_DIR, `questions-${meta.contentVersion}.csv`)
    const csv = questionsCsv(questions, meta.contentVersion)
    // Exports are history (spec 13.4): a set version, once exported, is never rewritten.
    if (existsSync(file) && readFileSync(file, 'utf8') !== csv) {
      console.error(`export:questions ${meta.id}: ${file} exists with different content; increase contentVersion in pack.json`)
      process.exitCode = 1
      continue
    }
    writeFileSync(file, csv)
    console.log(`export:questions ${meta.id}: ${questions.length} question(s) → ${file}`)
  }
}

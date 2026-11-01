// Cumulative question file for the review sheet (spec 13.4): every question version from all
// exports/questions-<contentVersion>.csv, one row per key, in order of first appearance.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RawPack } from './content.ts'
import { COLUMNS, EXPORT_DIR, csvLine } from './export-questions.ts'
import { questionKey } from './lock.ts'
import type { PackMeta, Question } from '../src/content/types.ts'

export const CUMULATIVE_PATH = 'review/questions-all.csv'
const EXPORT_FILE = /^questions-(\d{4}-\d{2}-\d{2})\.(\d+)\.csv$/

/** Columns that must not differ between two exports of the same key (spec 13.1 versioned fields). */
const TEXT_COLUMNS = ['scenario', 'prompt', 'options', 'correct', 'explanation', 'interpretation', 'ruleRefs'] as const

export interface ExportFile {
  name: string
  content: string
}

export function readExports(dir = EXPORT_DIR): ExportFile[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => EXPORT_FILE.test(name))
    .map((name) => ({ name, content: readFileSync(join(dir, name), 'utf8') }))
}

/** Oldest set version first: by date, then by the counter of that day (numerically). */
function bySetVersion(a: ExportFile, b: ExportFile): number {
  const [, dateA, nA] = EXPORT_FILE.exec(a.name)!
  const [, dateB, nB] = EXPORT_FILE.exec(b.name)!
  return dateA === dateB ? Number(nA) - Number(nB) : dateA < dateB ? -1 : 1
}

/** RFC 4180 parser for the files written by export-questions.ts. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length > 0) rows.push([...row, cell])
  return rows
}

export interface Cumulative {
  csv: string
  keys: string[]
  errors: string[]
}

export function buildCumulative(files: ExportFile[]): Cumulative {
  const errors: string[] = []
  const rows = new Map<string, string[]>()
  const keyIndex = COLUMNS.indexOf('key')
  for (const file of [...files].sort(bySetVersion)) {
    const [header, ...body] = parseCsv(file.content)
    if (header?.join(',') !== COLUMNS.join(',')) {
      errors.push(`exports/${file.name}: columns differ from spec 13.4`)
      continue
    }
    for (const row of body) {
      const key = row[keyIndex]
      const first = rows.get(key)
      if (!first) {
        rows.set(key, row)
        continue
      }
      for (const col of TEXT_COLUMNS) {
        const i = COLUMNS.indexOf(col)
        if (first[i] !== row[i]) errors.push(`exports/${file.name} ${key}: "${col}" differs from an earlier export of the same key`)
      }
    }
  }
  const lines = [COLUMNS as readonly string[], ...rows.values()].map(csvLine)
  return { csv: lines.join('\r\n') + '\r\n', keys: [...rows.keys()], errors }
}

/** Cumulative file plus a warning for every current question key that no export contains yet. */
export function cumulativeForPacks(packs: RawPack[], files = readExports()): Cumulative & { warnings: string[] } {
  const result = buildCumulative(files)
  const exported = new Set(result.keys)
  const warnings: string[] = []
  for (const raw of packs) {
    const meta = raw.meta as PackMeta
    for (const q of (raw.questions[meta.defaultLocale] ?? []) as Question[]) {
      const key = questionKey(q)
      if (!exported.has(key)) warnings.push(`exports: ${key} is not in any export; run npm run export:questions`)
    }
  }
  return { ...result, warnings }
}

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { BuildMode } from './build-mode.ts'
import type { Pack, PackMeta, Question } from '../src/content/types.ts'

export const CONTENT_DIR = join(import.meta.dirname, '..', 'content')
const QUESTIONS_FILE = /^questions\.([a-z]{2}(?:-[A-Z]{2})?)\.json$/

export interface RawPack {
  dir: string
  meta: unknown
  /** locale → parsed questions file */
  questions: Record<string, unknown>
  /** question key → hash from question-lock.json (spec 13.1), if the file exists */
  lock?: Record<string, string>
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function readRawPacks(contentDir = CONTENT_DIR): RawPack[] {
  const packsDir = join(contentDir, 'packs')
  return readdirSync(packsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((name) => {
      const dir = join(packsDir, name)
      const questions: Record<string, unknown> = {}
      for (const file of readdirSync(dir).sort()) {
        const match = QUESTIONS_FILE.exec(file)
        if (match) questions[match[1]] = readJson(join(dir, file))
      }
      const metaPath = join(dir, 'pack.json')
      const lockPath = join(dir, 'question-lock.json')
      return {
        dir,
        meta: existsSync(metaPath) ? readJson(metaPath) : undefined,
        questions,
        lock: existsSync(lockPath) ? (readJson(lockPath) as Record<string, string>) : undefined,
      }
    })
}

export function readUiStrings(contentDir = CONTENT_DIR): Record<string, unknown> {
  const dir = join(contentDir, 'i18n')
  const result: Record<string, unknown> = {}
  for (const file of readdirSync(dir).sort()) {
    const match = /^ui\.(.+)\.json$/.exec(file)
    if (match) result[match[1]] = readJson(join(dir, file))
  }
  return result
}

export interface ReviewConfig {
  enabled: boolean
  formUrl: string
  entryQuestionKey: string
  entrySetVersion: string
}

/** content/review.json (spec 13.3), maintained by Cowork. */
export function readReviewConfig(contentDir = CONTENT_DIR): unknown {
  const path = join(contentDir, 'review.json')
  return existsSync(path) ? readJson(path) : undefined
}

/** Comment-link settings for the browser: preview builds only, and only once the form URL is set. */
export function shippedReviewConfig(mode: BuildMode, config: unknown): ReviewConfig | null {
  const c = config as ReviewConfig | undefined
  return mode === 'preview' && c?.enabled && c.formUrl ? c : null
}

/** Questions that ship in a build of the given mode. */
export function isShipped(q: Question, mode: BuildMode): boolean {
  return mode === 'preview' || q.status === 'approved'
}

/** Packs for the browser bundle: filtered by build mode, review notes stripped. Assumes validated input. */
export function buildPacks(mode: BuildMode, contentDir = CONTENT_DIR): Pack[] {
  return readRawPacks(contentDir).map((raw) => {
    const questions: Record<string, Question[]> = {}
    for (const [locale, list] of Object.entries(raw.questions)) {
      questions[locale] = (list as Question[])
        .filter((q) => isShipped(q, mode))
        .map(({ reviewNote: _reviewNote, ...q }) => q)
    }
    return { meta: raw.meta as PackMeta, questions }
  })
}

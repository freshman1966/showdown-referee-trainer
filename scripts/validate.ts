// Content validator (spec 6.4). Run: npm run validate [-- --mode=production|preview]
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import { resolveBuildMode, type BuildMode } from './build-mode.ts'
import { readRawPacks, readUiStrings, isShipped, type RawPack } from './content.ts'
import { QUESTIONS_PER_RUN } from '../src/config.ts'
import type { PackMeta, Question } from '../src/content/types.ts'

const SCHEMA_DIR = join(import.meta.dirname, '..', 'schema')
const LEVEL_PREFIX = { trainee: 'T', national: 'N', international: 'I' } as const
/** Fields a translation may change. Everything else must match the default-locale file. */
const TEXT_FIELDS = new Set(['prompt', 'scenario', 'options', 'explanation', 'reviewNote'])

export interface Report {
  errors: string[]
  warnings: string[]
}

function loadSchema(name: string): object {
  return JSON.parse(readFileSync(join(SCHEMA_DIR, name), 'utf8'))
}

export function validateContent(packs: RawPack[], ui: Record<string, unknown>, mode: BuildMode): Report {
  const errors: string[] = []
  const warnings: string[] = []
  const ajv = new Ajv2020({ allErrors: true })
  const checkPack = ajv.compile(loadSchema('pack.schema.json'))
  const checkQuestions = ajv.compile(loadSchema('questions.schema.json'))
  const seenIds = new Map<string, string>()

  for (const raw of packs) {
    const folder = raw.dir.split(/[\\/]/).pop()!
    const where = `packs/${folder}`
    if (!checkPack(raw.meta)) {
      for (const e of checkPack.errors ?? []) errors.push(`${where}/pack.json${e.instancePath} ${e.message}`)
      continue
    }
    const meta = raw.meta as PackMeta
    if (meta.id !== folder) errors.push(`${where}/pack.json: id "${meta.id}" differs from folder name "${folder}"`)

    const locales = Object.keys(raw.questions)
    for (const locale of locales) {
      const list = raw.questions[locale]
      if (!checkQuestions(list)) {
        for (const e of checkQuestions.errors ?? []) {
          errors.push(`${where}/questions.${locale}.json${e.instancePath} ${e.message}`)
        }
        delete raw.questions[locale]
      }
    }

    const base = raw.questions[meta.defaultLocale] as Question[] | undefined
    if (!base) {
      errors.push(`${where}: no valid questions.${meta.defaultLocale}.json for the default locale`)
      continue
    }

    for (const q of base) {
      const at = `${where} ${q.id}`
      const other = seenIds.get(q.id)
      if (other) errors.push(`${at}: duplicate id (also in ${other})`)
      seenIds.set(q.id, where)

      if (!q.id.startsWith(`${LEVEL_PREFIX[q.level]}-`)) {
        errors.push(`${at}: id prefix does not match level "${q.level}"`)
      }
      if (!meta.levels.includes(q.level)) errors.push(`${at}: level "${q.level}" is not listed in pack.json`)
      if (q.edition !== meta.edition) warnings.push(`${at}: edition ${q.edition} differs from pack edition ${meta.edition}`)

      const optionIds = q.options.map((o) => o.id)
      if (new Set(optionIds).size !== optionIds.length) errors.push(`${at}: duplicate option ids`)
      for (const c of q.correct) {
        if (!optionIds.includes(c)) errors.push(`${at}: correct id "${c}" is not an option`)
      }
      if (q.type === 'single' && q.correct.length !== 1) {
        errors.push(`${at}: single question needs exactly one correct option, has ${q.correct.length}`)
      }
      if (q.requiresVision && !q.media) errors.push(`${at}: requiresVision is true but media is missing`)
    }

    // Translations: same ids, same non-text fields (spec 6.3).
    for (const locale of Object.keys(raw.questions)) {
      if (locale === meta.defaultLocale) continue
      const translated = new Map((raw.questions[locale] as Question[]).map((q) => [q.id, q]))
      for (const q of base) {
        const t = translated.get(q.id)
        if (!t) {
          errors.push(`${where} ${q.id}: missing in questions.${locale}.json`)
          continue
        }
        translated.delete(q.id)
        for (const key of Object.keys(q) as (keyof Question)[]) {
          if (TEXT_FIELDS.has(key)) continue
          if (JSON.stringify(q[key]) !== JSON.stringify(t[key])) {
            errors.push(`${where} ${q.id}: "${key}" in questions.${locale}.json differs from ${meta.defaultLocale}`)
          }
        }
        const ids = (o: Question) => JSON.stringify(o.options.map((x) => x.id))
        if (ids(q) !== ids(t)) errors.push(`${where} ${q.id}: option ids in questions.${locale}.json differ`)
        if ((q.scenario === null) !== (t.scenario === null)) {
          errors.push(`${where} ${q.id}: scenario in questions.${locale}.json is ${t.scenario === null ? 'missing' : 'extra'}`)
        }
      }
      for (const id of translated.keys()) errors.push(`${where} ${id}: in questions.${locale}.json but not in ${meta.defaultLocale}`)
    }

    // Pool size per level. A level without any shipped question is shown as "coming soon";
    // a level with some but too few questions would break a run, so that fails the build.
    for (const level of meta.levels) {
      const pool = base.filter((q) => q.level === level && isShipped(q, mode))
      const kind = mode === 'production' ? 'approved' : 'shipped'
      if (pool.length === 0) {
        warnings.push(`${where} ${level}: no ${kind} questions; the level is shown as "coming soon"`)
      } else if (pool.length < QUESTIONS_PER_RUN) {
        const msg = `${where} ${level}: ${pool.length} ${kind} questions, a run needs ${QUESTIONS_PER_RUN}`
        if (mode === 'production') errors.push(msg)
        else warnings.push(msg)
      }
    }
  }

  // UI strings: every locale has exactly the keys of English.
  const keysOf = (obj: unknown, prefix = ''): string[] =>
    obj && typeof obj === 'object'
      ? Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [prefix + k] : keysOf(v, `${prefix}${k}.`)))
      : []
  const en = ui.en
  if (!en) errors.push('i18n: ui.en.json is missing')
  else {
    const enKeys = new Set(keysOf(en))
    for (const [locale, strings] of Object.entries(ui)) {
      if (locale === 'en') continue
      const keys = new Set(keysOf(strings))
      for (const k of enKeys) if (!keys.has(k)) errors.push(`i18n: ui.${locale}.json is missing "${k}"`)
      for (const k of keys) if (!enKeys.has(k)) errors.push(`i18n: ui.${locale}.json has unknown key "${k}"`)
    }
  }

  return { errors, warnings }
}

function parseMode(argv: string[]): BuildMode {
  const arg = argv.find((a) => a.startsWith('--mode='))?.slice('--mode='.length)
  if (arg === 'production' || arg === 'preview') return arg
  if (arg) throw new Error(`Unknown mode "${arg}"`)
  return resolveBuildMode()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = parseMode(process.argv.slice(2))
  const packs = readRawPacks()
  const { errors, warnings } = validateContent(packs, readUiStrings(), mode)
  for (const w of warnings) console.warn(`warning: ${w}`)
  for (const e of errors) console.error(`error: ${e}`)
  const count = packs.flatMap((p) => Object.values(p.questions)).reduce<number>((n, l) => n + (Array.isArray(l) ? l.length : 0), 0)
  console.log(`validate (${mode}): ${packs.length} pack(s), ${count} question entries, ${errors.length} error(s), ${warnings.length} warning(s)`)
  process.exitCode = errors.length > 0 ? 1 : 0
}

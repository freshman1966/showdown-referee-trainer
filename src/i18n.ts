import en from '../content/i18n/ui.en.json'

type Strings = typeof en
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>
}[keyof T & string]

export type UiKey = Exclude<Paths<Strings>, `_meta.${string}`>
export type Params = Record<string, string | number>

// v1 ships English only (spec 1, decisions). Other locales plug in here.
const catalogs: Record<string, unknown> = { en }
let locale = 'en'

export function setLocale(next: string): void {
  if (catalogs[next]) locale = next
}

export function getLocale(): string {
  return locale
}

export function availableLocales(): string[] {
  return Object.keys(catalogs)
}

function lookup(catalog: unknown, key: string): string | undefined {
  let node: unknown = catalog
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** Translated UI string with {placeholders} filled in. */
export function t(key: UiKey, params: Params = {}): string {
  const template = lookup(catalogs[locale], key) ?? lookup(en, key) ?? key
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/** Display form of an edition id: "2026-2028" → "2026–2028". */
export function formatEdition(edition: string): string {
  return edition.replace('-', '–')
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
}

export function formatRuleRefs(refs: string[]): string {
  return t(refs.length === 1 ? 'feedback.rule' : 'feedback.rules', { refs: refs.join(', ') })
}

/** Like t(), but fills placeholders with rendered nodes, e.g. styled numbers. */
export function tNodes<N>(key: UiKey, nodes: Record<string, N>): (string | N)[] {
  const template = lookup(catalogs[locale], key) ?? lookup(en, key) ?? key
  return template
    .split(/(\{\w+\})/)
    .filter((part) => part !== '')
    .map((part) => {
      const name = /^\{(\w+)\}$/.exec(part)?.[1]
      return name !== undefined && name in nodes ? nodes[name] : part
    })
}

import type { ThemeSetting } from './state/progress'

export type Theme = 'light' | 'dark' | 'high-contrast'

/** "Same as device" follows prefers-contrast first, then prefers-color-scheme (spec 12). */
export function resolveTheme(setting: ThemeSetting, matches: (query: string) => boolean): Theme {
  if (setting !== 'system') return setting
  if (matches('(prefers-contrast: more)')) return 'high-contrast'
  if (matches('(prefers-color-scheme: dark)')) return 'dark'
  return 'light'
}

const QUERIES = ['(prefers-contrast: more)', '(prefers-color-scheme: dark)']

/** Applies the theme to <html data-theme> and follows device changes while set to "system". */
export function watchTheme(setting: ThemeSetting): () => void {
  const apply = () => {
    document.documentElement.dataset.theme = resolveTheme(setting, (q) => window.matchMedia(q).matches)
  }
  apply()
  if (setting !== 'system') return () => {}
  const lists = QUERIES.map((q) => window.matchMedia(q))
  lists.forEach((l) => l.addEventListener('change', apply))
  return () => lists.forEach((l) => l.removeEventListener('change', apply))
}

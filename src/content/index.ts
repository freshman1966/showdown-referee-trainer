import { packs } from 'virtual:content'
import type { LevelId, Pack, Question } from './types'

export { packs }

export function getPack(id: string): Pack | undefined {
  return packs.find((p) => p.meta.id === id)
}

/** Questions of a pack in the given locale, falling back to the pack's default locale. */
export function questionsOf(pack: Pack, locale: string): Question[] {
  return pack.questions[locale] ?? pack.questions[pack.meta.defaultLocale] ?? []
}

export function levelPool(pack: Pack, levelId: LevelId, locale: string): Question[] {
  return questionsOf(pack, locale).filter((q) => q.level === levelId)
}

export function isLevelId(pack: Pack, id: string): id is LevelId {
  return (pack.meta.levels as string[]).includes(id)
}

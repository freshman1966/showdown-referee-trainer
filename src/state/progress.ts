import { TIMER_OPTIONS } from '../config'
import type { LevelId, PackMeta, Question } from '../content/types'
import { correctCount, isPassed, score, type Run } from '../game/run'

export type ThemeSetting = 'system' | 'light' | 'dark' | 'high-contrast'
export type TimerSetting = (typeof TIMER_OPTIONS)[number]
export type BadgeId = LevelId | 'cleanSheet' | 'rulebook'

export interface Settings {
  timer: TimerSetting
  theme: ThemeSetting
  sound: boolean
  locale: string
}

export interface BestScore {
  player: number
  rulebook: number
  date: string
}

/** Stored progress (spec 7). Level keys are "<packId>/<levelId>". */
export interface Progress {
  v: 1
  unlocked: string[]
  passed: string[]
  best: Record<string, BestScore>
  badges: BadgeId[]
  correctIds: string[]
  wrongIds: string[]
  settings: Settings
}

export const BADGE_ORDER: BadgeId[] = ['trainee', 'national', 'international', 'cleanSheet', 'rulebook']

export const defaultSettings = (): Settings => ({ timer: 0, theme: 'system', sound: false, locale: 'en' })

export const emptyProgress = (settings: Settings = defaultSettings()): Progress => ({
  v: 1,
  unlocked: [],
  passed: [],
  best: {},
  badges: [],
  correctIds: [],
  wrongIds: [],
  settings,
})

export const levelKey = (packId: string, levelId: LevelId) => `${packId}/${levelId}`

export type LevelState = 'passed' | 'unlocked' | 'locked' | 'comingSoon'

/** The first level of a pack is always open; each further level opens when the one before is passed. */
export function levelState(progress: Progress, meta: PackMeta, levelId: LevelId, poolSize: number): LevelState {
  if (poolSize === 0) return 'comingSoon'
  const key = levelKey(meta.id, levelId)
  if (progress.passed.includes(key)) return 'passed'
  if (meta.levels[0] === levelId || progress.unlocked.includes(key)) return 'unlocked'
  return 'locked'
}

export function isPlayable(state: LevelState): boolean {
  return state === 'passed' || state === 'unlocked'
}

export interface RunOutcome {
  passed: boolean
  newBest: boolean
  newBadges: BadgeId[]
  /** Level opened by this run, if any. */
  unlockedLevel: LevelId | null
}

const addUnique = <T>(list: T[], ...items: T[]) => [...list, ...items.filter((i) => !list.includes(i))]

/**
 * Applies a finished level run to the stored progress (spec 3.3, 3.5, 7).
 * Practice runs do not change progress.
 * `levelPool` is the level's full pool in this build, used for the "Rulebook" badge.
 */
export function applyRun(
  progress: Progress,
  run: Run,
  meta: PackMeta,
  levelPool: readonly Question[],
  now: Date = new Date(),
): { progress: Progress; outcome: RunOutcome } {
  const outcome: RunOutcome = { passed: false, newBest: false, newBadges: [], unlockedLevel: null }
  if (run.kind !== 'level' || run.levelId === null) return { progress, outcome }

  const levelId = run.levelId
  const key = levelKey(meta.id, levelId)
  const next: Progress = { ...progress }

  // Answer history drives the extra draw weight for questions answered wrong (spec 3.1a).
  let correctIds = [...progress.correctIds]
  let wrongIds = [...progress.wrongIds]
  run.items.forEach((item, i) => {
    const id = item.question.id
    if (run.answers[i]?.correct) {
      correctIds = addUnique(correctIds, id)
      wrongIds = wrongIds.filter((w) => w !== id)
    } else if (run.answers[i]) {
      wrongIds = addUnique(wrongIds, id)
    }
  })
  next.correctIds = correctIds
  next.wrongIds = wrongIds

  const s = score(run.answers)
  const best = progress.best[key]
  if (!best || s.player > best.player) {
    // Only an improvement on an earlier score counts as "new best"; the first score is just stored.
    outcome.newBest = best !== undefined
    next.best = { ...progress.best, [key]: { ...s, date: now.toISOString() } }
  }

  const badges: BadgeId[] = []
  outcome.passed = isPassed(run)
  if (outcome.passed) {
    next.passed = addUnique(progress.passed, key)
    badges.push(levelId)
    const nextLevel = meta.levels[meta.levels.indexOf(levelId) + 1]
    if (nextLevel) {
      const nextKey = levelKey(meta.id, nextLevel)
      if (!progress.unlocked.includes(nextKey) && !progress.passed.includes(nextKey)) {
        next.unlocked = addUnique(progress.unlocked, nextKey)
        outcome.unlockedLevel = nextLevel
      }
    }
  }
  if (correctCount(run.answers) === run.items.length) badges.push('cleanSheet')
  if (levelPool.length > 0 && levelPool.every((q) => correctIds.includes(q.id))) badges.push('rulebook')

  outcome.newBadges = badges.filter((b) => !progress.badges.includes(b))
  next.badges = addUnique(progress.badges, ...outcome.newBadges)
  return { progress: next, outcome }
}

/** Resets everything except settings (spec 7). */
export function resetProgress(progress: Progress): Progress {
  return emptyProgress(progress.settings)
}

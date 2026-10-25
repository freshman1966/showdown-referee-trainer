import { createContext } from 'preact'
import { useCallback, useContext, useMemo, useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { QUESTIONS_PER_RUN } from '../config'
import { getPack, levelPool, packs } from '../content'
import type { LevelId, Question } from '../content/types'
import { drawRun, type Rng } from '../game/draw'
import type { Answer, Run } from '../game/run'
import { navigate } from '../router'
import { applyRun, isPlayable, levelState, type Progress, type RunOutcome, type Settings } from './progress'
import type { Store } from './storage'

export interface FinishedRun {
  run: Run
  outcome: RunOutcome
}

interface AppState {
  progress: Progress
  storageAvailable: boolean
  run: Run | null
  lastResult: FinishedRun | null
  updateSettings(patch: Partial<Settings>): void
  replaceProgress(progress: Progress): void
  startLevel(packId: string, levelId: LevelId): void
  startPractice(): void
  answer(answer: Answer): void
  finishRun(): void
}

const AppContext = createContext<AppState | null>(null)

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}

/** All questions of every playable level, for "Practice all unlocked" (spec 3.1). */
export function practicePool(progress: Progress): Question[] {
  const locale = progress.settings.locale
  return packs.flatMap((pack) =>
    pack.meta.levels.flatMap((levelId) => {
      const pool = levelPool(pack, levelId, locale)
      return isPlayable(levelState(progress, pack.meta, levelId, pool.length)) ? pool : []
    }),
  )
}

export function AppProvider({ store, rng, children }: { store: Store; rng?: Rng; children: ComponentChildren }) {
  const [progress, setProgress] = useState(() => store.load())
  const [run, setRun] = useState<Run | null>(null)
  const [lastResult, setLastResult] = useState<FinishedRun | null>(null)

  const commit = useCallback(
    (next: Progress) => {
      setProgress(next)
      store.save(next)
    },
    [store],
  )

  const value = useMemo<AppState>(() => {
    const wrong = new Set(progress.wrongIds)
    const begin = (next: Run) => {
      setRun(next)
      setLastResult(null)
      navigate({ name: 'play' })
    }
    return {
      progress,
      storageAvailable: store.available,
      run,
      lastResult,
      updateSettings: (patch) => commit({ ...progress, settings: { ...progress.settings, ...patch } }),
      replaceProgress: commit,
      startLevel(packId, levelId) {
        const pack = getPack(packId)
        if (!pack) return
        const pool = levelPool(pack, levelId, progress.settings.locale)
        begin({ kind: 'level', packId, levelId, items: drawRun(pool, QUESTIONS_PER_RUN, wrong, rng), answers: [] })
      },
      startPractice() {
        const items = drawRun(practicePool(progress), QUESTIONS_PER_RUN, wrong, rng)
        begin({ kind: 'practice', packId: '', levelId: null, items, answers: [] })
      },
      answer(a) {
        setRun((r) => (r ? { ...r, answers: [...r.answers, a] } : r))
      },
      finishRun() {
        if (!run) return
        const pack = getPack(run.packId)
        let outcome: RunOutcome = { passed: false, newBest: false, newBadges: [], unlockedLevel: null }
        if (pack && run.levelId) {
          const applied = applyRun(progress, run, pack.meta, levelPool(pack, run.levelId, progress.settings.locale))
          commit(applied.progress)
          outcome = applied.outcome
        }
        setLastResult({ run, outcome })
        setRun(null)
        navigate({ name: 'result' }, true)
      },
    }
  }, [progress, run, lastResult, store, commit, rng])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

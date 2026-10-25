import { STORAGE_KEY, TIMER_OPTIONS } from '../config'
import { defaultSettings, emptyProgress, type Progress, type Settings } from './progress'

/** localStorage wrapper (spec 7). Without storage, progress lasts for the session only. */
export interface Store {
  available: boolean
  load(): Progress
  save(progress: Progress): void
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])

function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings()
  if (!raw || typeof raw !== 'object') return d
  const s = raw as Partial<Settings>
  return {
    timer: TIMER_OPTIONS.includes(s.timer as never) ? (s.timer as Settings['timer']) : d.timer,
    theme: ['system', 'light', 'dark', 'high-contrast'].includes(s.theme as string) ? (s.theme as Settings['theme']) : d.theme,
    sound: typeof s.sound === 'boolean' ? s.sound : d.sound,
    locale: typeof s.locale === 'string' ? s.locale : d.locale,
  }
}

/** Accepts any stored value and returns valid progress; unknown or broken data falls back to defaults. */
export function parseProgress(text: string | null): Progress {
  if (!text) return emptyProgress()
  try {
    const raw = JSON.parse(text) as Partial<Progress>
    if (!raw || raw.v !== 1) return emptyProgress()
    const best: Progress['best'] = {}
    if (raw.best && typeof raw.best === 'object') {
      for (const [k, b] of Object.entries(raw.best)) {
        if (b && typeof b.player === 'number' && typeof b.rulebook === 'number' && typeof b.date === 'string') best[k] = b
      }
    }
    return {
      v: 1,
      unlocked: strings(raw.unlocked),
      passed: strings(raw.passed),
      best,
      badges: strings(raw.badges) as Progress['badges'],
      correctIds: strings(raw.correctIds),
      wrongIds: strings(raw.wrongIds),
      settings: sanitizeSettings(raw.settings),
    }
  } catch {
    return emptyProgress()
  }
}

export function createStore(getStorage: () => Storage = () => window.localStorage): Store {
  let storage: Storage | null = null
  try {
    storage = getStorage()
    const probe = `${STORAGE_KEY}:probe`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
  } catch {
    storage = null
  }
  return {
    available: storage !== null,
    load() {
      try {
        return parseProgress(storage?.getItem(STORAGE_KEY) ?? null)
      } catch {
        return emptyProgress()
      }
    },
    save(progress) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(progress))
      } catch {
        // Quota or privacy mode: keep the in-memory state.
      }
    },
  }
}

import { useRef, useState } from 'preact/hooks'
import { TIMER_OPTIONS } from '../config'
import { availableLocales, t } from '../i18n'
import { Layout, PageHeading, navLinks, usePageTitle } from '../components/Layout'
import { useApp } from '../state/app'
import { resetProgress, type Settings as SettingsData, type ThemeSetting, type TimerSetting } from '../state/progress'

const TIMER_LABEL = { 0: 'settings.timerOff', 90: 'settings.timer90', 45: 'settings.timer45' } as const
const THEMES: { value: ThemeSetting; label: Parameters<typeof t>[0] }[] = [
  { value: 'system', label: 'settings.themeSystem' },
  { value: 'light', label: 'settings.themeLight' },
  { value: 'dark', label: 'settings.themeDark' },
  { value: 'high-contrast', label: 'settings.themeHighContrast' },
]

function languageName(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

function ResetDialog({ onConfirm }: { onConfirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" class="button button--danger" onClick={() => dialog.current?.showModal()}>
        {t('settings.reset')}
      </button>
      <dialog ref={dialog} class="dialog" aria-labelledby="reset-heading" aria-describedby="reset-text">
        <h2 id="reset-heading">{t('settings.resetDialogHeading')}</h2>
        <p id="reset-text">{t('settings.resetDialogText')}</p>
        <div class="button-row">
          <button
            type="button"
            class="button button--danger"
            onClick={() => {
              dialog.current?.close()
              onConfirm()
            }}
          >
            {t('settings.resetConfirm')}
          </button>
          <button type="button" class="button button--secondary" autofocus onClick={() => dialog.current?.close()}>
            {t('settings.resetCancel')}
          </button>
        </div>
      </dialog>
    </>
  )
}

export function Settings() {
  const { progress, storageAvailable, updateSettings, replaceProgress } = useApp()
  const [resetDone, setResetDone] = useState(false)
  const settings = progress.settings
  usePageTitle(t('settings.heading'))
  const set = (patch: Partial<SettingsData>) => {
    setResetDone(false)
    updateSettings(patch)
  }

  return (
    <Layout nav={[navLinks.done()]}>
      <PageHeading>{t('settings.heading')}</PageHeading>
      {!storageAvailable && <p class="notice">{t('settings.storageUnavailable')}</p>}

      <fieldset class="settings-group" aria-describedby="timer-hint">
        <legend>{t('settings.timerLegend')}</legend>
        <div class="segmented">
          {TIMER_OPTIONS.map((value) => (
            <label key={value} class={`option option--compact${settings.timer === value ? ' is-checked' : ''}`}>
              <span class="option__row">
                <input
                  type="radio"
                  name="timer"
                  value={value}
                  checked={settings.timer === value}
                  onChange={() => set({ timer: value as TimerSetting })}
                />
                <span>{t(TIMER_LABEL[value])}</span>
              </span>
            </label>
          ))}
        </div>
        <p id="timer-hint" class="muted small">
          {t('settings.timerHint')}
        </p>
      </fieldset>

      <fieldset class="settings-group">
        <legend>{t('settings.themeLegend')}</legend>
        {THEMES.map(({ value, label }) => (
          <label key={value} class={`option option--compact${settings.theme === value ? ' is-checked' : ''}`}>
            <span class="option__row">
              <input type="radio" name="theme" value={value} checked={settings.theme === value} onChange={() => set({ theme: value })} />
              <span>{t(label)}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div class="settings-group">
        <label class={`option option--compact${settings.sound ? ' is-checked' : ''}`}>
          <span class="option__row">
            <input
              type="checkbox"
              checked={settings.sound}
              aria-describedby="sound-hint"
              onChange={(e) => set({ sound: (e.currentTarget as HTMLInputElement).checked })}
            />
            <span>{t('settings.sound')}</span>
          </span>
        </label>
        <p id="sound-hint" class="muted small">
          {t('settings.soundHint')}
        </p>
      </div>

      <div class="settings-group">
        <label class="field-label" for="language">
          {t('settings.language')}
        </label>
        <select id="language" class="select" value={settings.locale} onChange={(e) => set({ locale: (e.currentTarget as HTMLSelectElement).value })}>
          {availableLocales().map((code) => (
            <option key={code} value={code}>
              {languageName(code)}
            </option>
          ))}
        </select>
      </div>

      <div class="settings-group">
        <ResetDialog
          onConfirm={() => {
            replaceProgress(resetProgress(progress))
            setResetDone(true)
          }}
        />
        <p role="status" class="small">
          {resetDone ? t('settings.resetDone') : ''}
        </p>
      </div>
    </Layout>
  )
}

import { t } from '../i18n'
import type { BadgeId } from '../state/progress'

/** Badge: icon plus text; the text carries the meaning (spec 3.5). */
export function Badge({ id }: { id: BadgeId }) {
  return (
    <div class="badge">
      <svg class="badge__icon" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false">
        <circle cx="12" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M8.5 14 7 22l5-3 5 3-1.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      </svg>
      <div>
        <p class="badge__name">{t(`badges.${id}.name`)}</p>
        <p class="badge__description">{t(`badges.${id}.description`)}</p>
      </div>
    </div>
  )
}

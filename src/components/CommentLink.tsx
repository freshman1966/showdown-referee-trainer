import { packs, review } from 'virtual:content'
import { questionKey } from '../content/key'
import type { Question } from '../content/types'
import { t } from '../i18n'

const setVersionById = new Map(packs.flatMap((p) => Object.values(p.questions).flat().map((q) => [q.id, p.meta.contentVersion])))

/** Pre-filled Google Form URL (spec 13.3), or null when review mode is off. */
export function commentUrl(question: Question): string | null {
  const setVersion = setVersionById.get(question.id)
  if (!review || !setVersion) return null
  const params = [
    'usp=pp_url',
    `${review.entryQuestionKey}=${encodeURIComponent(questionKey(question))}`,
    `${review.entrySetVersion}=${encodeURIComponent(setVersion)}`,
  ]
  return `${review.formUrl}${review.formUrl.includes('?') ? '&' : '?'}${params.join('&')}`
}

/** "Comment on this question" link; preview builds only, hidden until review.json has a form URL. */
export function CommentLink({ question }: { question: Question }) {
  const url = __PREVIEW__ ? commentUrl(question) : null
  if (!url) return null
  return (
    <p class="comment-link">
      <a class="text-link" href={url} target="_blank" rel="noopener noreferrer">
        {t('review.commentLink')} <span class="small">{t('review.commentLinkHint')}</span>
      </a>
    </p>
  )
}

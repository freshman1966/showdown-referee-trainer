import { useEffect, useState } from 'preact/hooks'
import { packs, questionsOf } from '../content'
import type { LevelId, Question, Topic } from '../content/types'
import { formatRuleRefs, t } from '../i18n'
import { CommentLink } from '../components/CommentLink'
import { Layout, PageHeading, navLinks, usePageTitle } from '../components/Layout'
import { href } from '../router'
import { useApp } from '../state/app'

const ALL = 'all'

/** DOM id of a question on this page; the route #/review/<id> scrolls to it. */
export const reviewAnchor = (id: string) => `review-${id}`

function ReviewItem({ question: q }: { question: Question }) {
  const headingId = `${reviewAnchor(q.id)}-heading`
  return (
    <li id={reviewAnchor(q.id)} class="card review-item">
      <h3 id={headingId} tabIndex={-1}>
        <a class="text-link" href={href({ name: 'review', questionId: q.id })}>
          {t('review.questionKey', { id: q.id, version: q.version })}
        </a>
      </h3>
      <p class="muted small">{q.topics.map((topic) => t(`topics.${topic}`)).join(', ')}</p>
      {q.scenario && <p>{q.scenario}</p>}
      <p class="strong">{q.prompt}</p>
      <ul class="review-options">
        {q.options.map((o) => (
          <li key={o.id}>
            {o.id}) {o.text}
            {q.correct.includes(o.id) && (
              <>
                {' – '}
                <b class="label-correct">{t('review.correctLabel')}</b>
              </>
            )}
          </li>
        ))}
      </ul>
      <p>{q.explanation}</p>
      {q.interpretation && (
        <div class="feedback__interpretation">
          <h4>{t('feedback.interpretationHeading')}</h4>
          <p>{q.interpretation}</p>
        </div>
      )}
      <p class="muted small">{formatRuleRefs(q.ruleRefs)}</p>
      <CommentLink question={q} />
    </li>
  )
}

/** "All questions" page for reviewers (spec 13.2); preview builds only. */
export function Review({ questionId }: { questionId?: string }) {
  const { progress } = useApp()
  const [level, setLevel] = useState<LevelId | typeof ALL>(ALL)
  const [topic, setTopic] = useState<Topic | typeof ALL>(ALL)
  const [onlyInterpretation, setOnlyInterpretation] = useState(false)
  usePageTitle(t('review.heading'))

  const levels = [...new Set(packs.flatMap((p) => p.meta.levels))]
  const questions = packs.flatMap((p) => questionsOf(p, progress.settings.locale))
  const topics = [...new Set(questions.flatMap((q) => q.topics))].sort((a, b) => t(`topics.${a}`).localeCompare(t(`topics.${b}`)))
  const shown = questions.filter(
    (q) =>
      (level === ALL || q.level === level) &&
      (topic === ALL || q.topics.includes(topic)) &&
      (!onlyInterpretation || Boolean(q.interpretation)),
  )

  // Deep link #/review/<id>: move focus to that question's heading, which also scrolls it into view.
  useEffect(() => {
    if (!questionId) return
    document.getElementById(`${reviewAnchor(questionId)}-heading`)?.focus()
  }, [questionId])

  return (
    <Layout nav={[navLinks.home(), navLinks.settings()]}>
      <div class="stack">
        <PageHeading>{t('review.heading')}</PageHeading>
        <p class="lead">{t('review.intro')}</p>
      </div>

      <div class="review-filters">
        <div class="stack">
          <label class="field-label" for="review-level">
            {t('review.filterLevel')}
          </label>
          <select
            id="review-level"
            class="select"
            value={level}
            onChange={(e) => setLevel((e.currentTarget as HTMLSelectElement).value as LevelId | typeof ALL)}
          >
            <option value={ALL}>{t('review.filterAll')}</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {t(`levels.${l}.name`)}
              </option>
            ))}
          </select>
        </div>
        <div class="stack">
          <label class="field-label" for="review-topic">
            {t('review.filterTopic')}
          </label>
          <select
            id="review-topic"
            class="select"
            value={topic}
            onChange={(e) => setTopic((e.currentTarget as HTMLSelectElement).value as Topic | typeof ALL)}
          >
            <option value={ALL}>{t('review.filterAll')}</option>
            {topics.map((tp) => (
              <option key={tp} value={tp}>
                {t(`topics.${tp}`)}
              </option>
            ))}
          </select>
        </div>
        <label class="review-filters__check">
          <input
            type="checkbox"
            checked={onlyInterpretation}
            onChange={(e) => setOnlyInterpretation((e.currentTarget as HTMLInputElement).checked)}
          />
          <span>{t('review.filterInterpretation')}</span>
        </label>
      </div>

      {shown.length === 0 ? (
        <p>{t('review.noResults')}</p>
      ) : (
        levels.map((l) => {
          const inLevel = shown.filter((q) => q.level === l)
          if (inLevel.length === 0) return null
          return (
            <section key={l} class="stack" aria-labelledby={`review-level-${l}`}>
              <h2 id={`review-level-${l}`}>{t(`levels.${l}.name`)}</h2>
              <ol class="answer-list">
                {inLevel.map((q) => (
                  <ReviewItem key={q.id} question={q} />
                ))}
              </ol>
            </section>
          )
        })
      )}
    </Layout>
  )
}

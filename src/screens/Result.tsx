import { useEffect, useState } from 'preact/hooks'
import { PASS_MARK } from '../config'
import { getPack, levelPool } from '../content'
import type { Question } from '../content/types'
import { formatRuleRefs, t, tNodes } from '../i18n'
import { Badge } from '../components/Badge'
import { Layout, PageHeading, navLinks, usePageTitle } from '../components/Layout'
import type { Answer } from '../game/run'
import { correctCount, score } from '../game/run'
import { href, navigate } from '../router'
import { useApp } from '../state/app'
import { isPlayable, levelState } from '../state/progress'

function optionTexts(question: Question, ids: readonly string[]): string {
  const byId = new Map(question.options.map((o) => [o.id, o.text]))
  return ids.map((id) => byId.get(id) ?? id).join('; ')
}

function AnswerItem({ question, answer, showStatus }: { question: Question; answer: Answer; showStatus: boolean }) {
  return (
    <li class={`card answer-item answer-item--${answer.correct ? 'correct' : 'incorrect'}`}>
      <p class="answer-item__title">{question.scenario ?? question.prompt}</p>
      {showStatus && (
        <p class="answer-item__status">
          {t(answer.correct ? 'feedback.labelYourAnswerCorrect' : 'feedback.labelYourAnswerIncorrect')}
        </p>
      )}
      <p>
        <b class="label-incorrect">{t('result.yourAnswer')}</b>{' '}
        {answer.selected ? optionTexts(question, answer.selected) : t('result.noAnswer')}
      </p>
      <p>
        <b class="label-correct">{t('result.correctAnswer')}</b> {optionTexts(question, question.correct)}
      </p>
      <p class="muted small">
        {formatRuleRefs(question.ruleRefs)} · {t('a11y.questionId', { id: question.id })}
      </p>
    </li>
  )
}

export function Result() {
  const { lastResult, progress, startLevel, startPractice } = useApp()
  const [showAll, setShowAll] = useState(false)
  const run = lastResult?.run
  const levelName = run?.levelId ? t(`levels.${run.levelId}.name`) : ''
  const passed = lastResult?.outcome.passed ?? false
  const heading = !run ? '' : run.kind === 'practice' ? t('result.practiceDone') : passed ? t('result.passed') : t('result.notPassed')
  usePageTitle(heading)

  useEffect(() => {
    if (!lastResult) navigate({ name: 'home' }, true)
  }, [lastResult])
  if (!lastResult || !run) return null

  const { outcome } = lastResult
  const s = score(run.answers)
  const total = run.items.length
  const wrong = run.items.map((item, i) => ({ ...item, answer: run.answers[i] })).filter((x) => !x.answer.correct)
  const pack = getPack(run.packId)
  const nextLevel = pack && run.levelId ? pack.meta.levels[pack.meta.levels.indexOf(run.levelId) + 1] : undefined
  const nextPlayable =
    pack && nextLevel
      ? isPlayable(levelState(progress, pack.meta, nextLevel, levelPool(pack, nextLevel, progress.settings.locale).length))
      : false

  return (
    <Layout nav={[navLinks.home()]}>
      <div class="stack result-head">
        {run.levelId && <p class="eyebrow">{t('result.label', { level: levelName })}</p>}
        <PageHeading>{heading}</PageHeading>
        <p class="result-score">
          <span class="visually-hidden">{t('question.scoreLabel', s)}</span>
          <span aria-hidden="true">
            {tNodes('question.scoreLine', {
              player: <span class="score-number score-number--large">{s.player}</span>,
              rulebook: <span class="score-number score-number--large">{s.rulebook}</span>,
            })}
          </span>
        </p>
        <p class="lead">
          {run.kind === 'level'
            ? t('result.correctCount', { correct: correctCount(run.answers), total, passMark: Math.min(PASS_MARK, total) })
            : t('result.correctCountPractice', { correct: correctCount(run.answers), total })}
        </p>
        {run.kind === 'level' && outcome.newBest && <p>{t('result.newBest')}</p>}
      </div>

      {(outcome.newBadges.length > 0 || outcome.unlockedLevel) && (
        <div class="highlight stack">
          {outcome.newBadges.length > 0 && <p class="highlight__label">{t('result.newBadge')}</p>}
          {outcome.newBadges.map((id) => (
            <Badge key={id} id={id} />
          ))}
          {outcome.unlockedLevel && (
            <p>{t('result.levelUnlocked', { level: t(`levels.${outcome.unlockedLevel}.name`) })}</p>
          )}
        </div>
      )}

      <section class="stack" aria-labelledby="review-heading">
        <h2 id="review-heading">{t('result.reviewHeading', { count: wrong.length })}</h2>
        {wrong.length === 0 ? (
          <p>{t('result.reviewNone')}</p>
        ) : (
          <ul class="answer-list">
            {wrong.map((x) => (
              <AnswerItem key={x.question.id} question={x.question} answer={x.answer} showStatus={false} />
            ))}
          </ul>
        )}
        <div>
          <button type="button" class="text-button" aria-expanded={showAll} aria-controls="all-answers" onClick={() => setShowAll(!showAll)}>
            {showAll ? t('result.hideAll') : t('result.showAll', { count: total })}
          </button>
        </div>
        <ol id="all-answers" class="answer-list" hidden={!showAll}>
          {run.items.map((item, i) => (
            <AnswerItem key={item.question.id} question={item.question} answer={run.answers[i]} showStatus />
          ))}
        </ol>
      </section>

      <div class="button-row">
        {run.kind === 'level' && run.levelId && pack ? (
          <>
            {passed && nextLevel && nextPlayable && (
              <a class="button button--accent" href={href({ name: 'level', packId: pack.meta.id, levelId: nextLevel })}>
                {t('result.startNext', { level: t(`levels.${nextLevel}.name`) })}
              </a>
            )}
            <button type="button" class="button button--secondary" onClick={() => startLevel(pack.meta.id, run.levelId!)}>
              {t('result.retry', { level: levelName })}
            </button>
          </>
        ) : (
          <button type="button" class="button button--secondary" onClick={startPractice}>
            {t('practice.start')}
          </button>
        )}
        <a class="button button--secondary" href={href({ name: 'home' })}>
          {t('result.backToLevels')}
        </a>
      </div>
    </Layout>
  )
}

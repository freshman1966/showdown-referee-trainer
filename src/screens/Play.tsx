import { useEffect, useRef, useState } from 'preact/hooks'
import { PASS_MARK, STREAK_MIN, TIMER_WARNING_SECONDS } from '../config'
import type { Question } from '../content/types'
import { formatRuleRefs, t, tNodes } from '../i18n'
import { PageHeading, PreviewBanner, SkipLink, usePageTitle } from '../components/Layout'
import { useAnnounce } from '../components/Announcer'
import { isCorrect, score, streak, type Answer, type Run } from '../game/run'
import { href, navigate } from '../router'
import { useApp } from '../state/app'
import { whistle } from '../sound'

type OptionStatus = 'correct' | 'yourCorrect' | 'yourIncorrect' | 'missed' | 'neutral'

/** Feedback label per option (spec 12, feedback state). */
export function optionStatus(question: Question, optionId: string, answer: Answer): OptionStatus {
  const isRight = question.correct.includes(optionId)
  const chosen = answer.selected?.includes(optionId) ?? false
  if (chosen) return isRight ? 'yourCorrect' : 'yourIncorrect'
  if (!isRight) return 'neutral'
  // A correct option the player did not pick in a multiple-choice question they answered.
  return question.type === 'multiple' && answer.selected && answer.selected.length > 0 ? 'missed' : 'correct'
}

const STATUS_LABEL = {
  correct: 'feedback.labelCorrectAnswer',
  yourCorrect: 'feedback.labelYourAnswerCorrect',
  yourIncorrect: 'feedback.labelYourAnswerIncorrect',
  missed: 'feedback.labelMissed',
} as const

export function progressText(run: Run, index: number): string {
  const params = { current: index + 1, total: run.items.length }
  return run.levelId
    ? t('question.progress', { ...params, level: t(`levels.${run.levelId}.name`) })
    : t('question.progressPractice', params)
}

function ScorePanel({ run, index, secondsLeft }: { run: Run; index: number; secondsLeft: number | null }) {
  const s = score(run.answers)
  const currentStreak = streak(run.answers)
  const answered = run.answers.length
  const total = run.items.length
  return (
    <aside class="score-panel" aria-label={t('question.progressLabel')}>
      <p class="score-panel__progress">{progressText(run, index)}</p>
      <div
        class="progress"
        role="progressbar"
        aria-label={t('question.progressLabel')}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answered}
      >
        <div class="progress__fill" style={{ width: `${(answered / total) * 100}%` }} />
      </div>
      <p class="score-panel__score">
        <span class="visually-hidden">{t('question.scoreLabel', s)}</span>
        <span aria-hidden="true">
          {tNodes('question.scoreLine', {
            player: <span class="score-number">{s.player}</span>,
            rulebook: <span class="score-number">{s.rulebook}</span>,
          })}
        </span>
      </p>
      {currentStreak >= STREAK_MIN && <p class="score-panel__streak">{t('question.streak', { count: currentStreak })}</p>}
      {secondsLeft !== null && (
        <p class={`score-panel__timer${secondsLeft <= TIMER_WARNING_SECONDS ? ' is-low' : ''}`}>
          {t('question.timeRemaining', { seconds: secondsLeft })}
        </p>
      )}
      {run.kind === 'level' && (
        <p class="score-panel__meta">
          {t('levelStart.passMark', { passMark: Math.min(PASS_MARK, total), count: total })}
        </p>
      )}
    </aside>
  )
}

function QuestionView({ run, index, onNext }: { run: Run; index: number; onNext: () => void }) {
  const { answer: recordAnswer, progress } = useApp()
  const announce = useAnnounce()
  const { question, optionOrder } = run.items[index]
  const answer: Answer | undefined = run.answers[index]
  const [selected, setSelected] = useState<string[]>([])
  const [showError, setShowError] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(progress.settings.timer || null)
  const feedbackHeading = useRef<HTMLHeadingElement>(null)
  const isLast = index === run.items.length - 1
  const inputType = question.type === 'single' ? 'radio' : 'checkbox'
  const optionsById = new Map(question.options.map((o) => [o.id, o]))

  const submit = (choice: string[] | null) => {
    const correct = isCorrect(choice, question.correct)
    const after = score([...run.answers, { selected: choice, correct }])
    recordAnswer({ selected: choice, correct })
    if (progress.settings.sound) whistle(correct ? 'double' : 'single')
    if (choice === null) announce(t('question.timeUp'), 'assertive')
    else announce(t(correct ? 'a11y.correctAnnouncement' : 'a11y.incorrectAnnouncement', after))
  }
  const submitRef = useRef(submit)
  submitRef.current = submit

  // Optional timer (spec 3.4): warning at 15 s, time-out counts as wrong.
  const timer = progress.settings.timer
  useEffect(() => {
    if (!timer || answer) {
      setSecondsLeft(null)
      return
    }
    const deadline = Date.now() + timer * 1000
    let warned = false
    setSecondsLeft(timer)
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSecondsLeft(left)
      if (!warned && left <= TIMER_WARNING_SECONDS && left > 0) {
        warned = true
        announce(t('question.timeWarning'))
      }
      if (left === 0) {
        window.clearInterval(id)
        submitRef.current(null)
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [timer, answer === undefined, announce])

  useEffect(() => {
    if (answer) feedbackHeading.current?.focus()
  }, [answer === undefined])

  const onSubmit = (e: Event) => {
    e.preventDefault()
    if (answer) return
    if (selected.length === 0) {
      setShowError(true)
      announce(t('question.noSelection'))
      return
    }
    submit(selected)
  }

  const toggle = (id: string, checked: boolean) => {
    setShowError(false)
    if (question.type === 'single') setSelected([id])
    else setSelected((s) => (checked ? [...s, id] : s.filter((x) => x !== id)))
  }

  const feedbackKind = !answer ? null : answer.selected === null ? 'timeUp' : answer.correct ? 'correct' : 'incorrect'

  return (
    <div class="play-layout">
      <ScorePanel run={run} index={index} secondsLeft={answer ? null : secondsLeft} />
      <main id="main" tabIndex={-1} class="play-main">
        <PageHeading class="visually-hidden">{progressText(run, index)}</PageHeading>

        {question.scenario && (
          <div class="card scenario">
            <p class="scenario__label">{t('question.scenarioLabel')}</p>
            <p class="scenario__text">{question.scenario}</p>
          </div>
        )}

        <form class="stack" onSubmit={onSubmit} noValidate data-question-id={question.id}>
          <fieldset class="options" disabled={answer !== undefined} aria-describedby={showError ? 'no-selection' : undefined}>
            <legend class="options__legend">
              {question.prompt}
              {question.type === 'multiple' && !question.prompt.includes(t('question.selectAll')) && (
                <span class="options__hint">{t('question.selectAll')}</span>
              )}
            </legend>
            {optionOrder.map((id) => {
              const option = optionsById.get(id)!
              const status = answer ? optionStatus(question, id, answer) : null
              const checked = answer ? (answer.selected?.includes(id) ?? false) : selected.includes(id)
              return (
                <label key={id} class={`option${checked ? ' is-checked' : ''}${status ? ` option--${status}` : ''}`}>
                  {status && status !== 'neutral' && <span class="option__status">{t(STATUS_LABEL[status])}</span>}
                  <span class="option__row">
                    <input
                      type={inputType}
                      name={`q-${question.id}`}
                      value={id}
                      checked={checked}
                      onChange={(e) => toggle(id, (e.currentTarget as HTMLInputElement).checked)}
                    />
                    <span>{option.text}</span>
                  </span>
                </label>
              )
            })}
          </fieldset>
          {showError && (
            <p id="no-selection" class="form-error">
              {t('question.noSelection')}
            </p>
          )}
          {!answer && (
            <div>
              <button type="submit" class="button button--primary">
                {t('question.submit')}
              </button>
            </div>
          )}
        </form>

        {answer && feedbackKind && (
          <section class={`feedback feedback--${answer.correct ? 'correct' : 'incorrect'}`} aria-labelledby="feedback-heading">
            <h2 id="feedback-heading" ref={feedbackHeading} tabIndex={-1}>
              {t(`feedback.${feedbackKind}Heading`)}
            </h2>
            <p>{question.explanation}</p>
            <p class="feedback__refs">{formatRuleRefs(question.ruleRefs)}</p>
            <p class="feedback__id">{t('a11y.questionId', { id: question.id })}</p>
            <div>
              <button type="button" class="button button--primary" onClick={onNext}>
                {isLast ? t('feedback.finish') : t('feedback.next')}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export function Play() {
  const { run, finishRun } = useApp()
  // Resume after leaving the screen (e.g. to settings): continue at the first unanswered question.
  const [index, setIndex] = useState(() => (run ? Math.min(run.answers.length, run.items.length - 1) : 0))
  const title = run && run.items.length > 0 ? progressText(run, index) : ''
  usePageTitle(title)

  useEffect(() => {
    if (!run || run.items.length === 0) navigate({ name: 'home' }, true)
  }, [run])
  if (!run || run.items.length === 0) return null

  const onNext = () => {
    if (index >= run.items.length - 1) {
      finishRun()
      return
    }
    setIndex(index + 1)
    requestAnimationFrame(() => document.getElementById('page-title')?.focus())
  }

  return (
    <>
      <SkipLink />
      <header>
        <PreviewBanner />
        <div class="site-header site-header--play">
        <div class="site-header__inner">
          <p class="brand brand--play">{t('app.name')}</p>
          <nav aria-label={t('app.name')}>
            <ul class="site-nav">
              <li>
                <a href={href({ name: 'home' })}>{t('nav.quitLevel')}</a>
              </li>
              <li>
                <a href={href({ name: 'settings' })}>{t('nav.settings')}</a>
              </li>
            </ul>
          </nav>
        </div>
        </div>
      </header>
      <QuestionView key={index} run={run} index={index} onNext={onNext} />
    </>
  )
}

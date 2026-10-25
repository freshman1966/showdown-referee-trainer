import { PASS_MARK, QUESTIONS_PER_RUN } from '../config'
import { getPack, isLevelId, levelPool } from '../content'
import type { Topic } from '../content/types'
import { t } from '../i18n'
import { Layout, PageHeading, navLinks, usePageTitle } from '../components/Layout'
import { NotFound } from './NotFound'
import { practicePool, useApp } from '../state/app'
import { isPlayable, levelState } from '../state/progress'

const TOPIC_ORDER: Topic[] = [
  'match-format', 'serve', 'faults', 'goal-area', 'dead-ball', 'time-outs',
  'change-sides', 'warnings-penalties', 'equipment', 'procedures', 'signals', 'team-play',
]

export function TimerInfo() {
  const { progress } = useApp()
  const seconds = progress.settings.timer
  return <p>{seconds > 0 ? t('levelStart.timerOn', { seconds }) : t('levelStart.timerOff')}</p>
}

export function LevelStart({ packId, levelId }: { packId: string; levelId: string }) {
  const { progress, startLevel } = useApp()
  const pack = getPack(packId)
  const valid = pack !== undefined && isLevelId(pack, levelId)
  const name = valid ? t(`levels.${levelId}.name`) : ''
  usePageTitle(valid ? name : t('errors.notFound'))
  if (!pack || !isLevelId(pack, levelId)) return <NotFound />

  const pool = levelPool(pack, levelId, progress.settings.locale)
  const state = levelState(progress, pack.meta, levelId, pool.length)
  const count = Math.min(QUESTIONS_PER_RUN, pool.length)
  const topics = TOPIC_ORDER.filter((topic) => pool.some((q) => q.topics.includes(topic)))
  const previous = pack.meta.levels[pack.meta.levels.indexOf(levelId) - 1]

  return (
    <Layout nav={[navLinks.home(), navLinks.settings()]}>
      <div class="stack">
        <PageHeading>{t('levelStart.heading', { level: name })}</PageHeading>
        <p class="lead">{t(`levels.${levelId}.description`)}</p>
      </div>

      {isPlayable(state) ? (
        <>
          <div class="card stack">
            <p class="strong">{t('levelStart.questions', { count })}</p>
            <p>{t('levelStart.passMark', { passMark: Math.min(PASS_MARK, count), count })}</p>
            <TimerInfo />
          </div>
          <section class="stack" aria-labelledby="topics-heading">
            <h2 id="topics-heading">{t('levelStart.topicsHeading')}</h2>
            <ul class="topic-list">
              {topics.map((topic) => (
                <li key={topic}>{t(`topics.${topic}`)}</li>
              ))}
            </ul>
          </section>
          <section class="stack" aria-labelledby="scoring-heading">
            <h2 id="scoring-heading">{t('levelStart.scoringHeading')}</h2>
            <p>{t('levelStart.scoringText')}</p>
          </section>
          <div>
            <button type="button" class="button button--accent" onClick={() => startLevel(pack.meta.id, levelId)}>
              {t('levelStart.start')}
            </button>
          </div>
        </>
      ) : (
        <p class="notice">
          {state === 'comingSoon'
            ? t('home.state.comingSoon')
            : previous
              ? t('home.lockedHint', { previousLevel: t(`levels.${previous}.name`) })
              : t('home.state.locked')}
        </p>
      )}
    </Layout>
  )
}

export function PracticeStart() {
  const { progress, startPractice } = useApp()
  usePageTitle(t('practice.heading'))
  const available = practicePool(progress).length > 0
  return (
    <Layout nav={[navLinks.home(), navLinks.settings()]}>
      <div class="stack">
        <PageHeading>{t('practice.heading')}</PageHeading>
        <p class="lead">{t('practice.intro')}</p>
      </div>
      {available ? (
        <>
          <div class="card stack">
            <TimerInfo />
          </div>
          <div>
            <button type="button" class="button button--accent" onClick={startPractice}>
              {t('practice.start')}
            </button>
          </div>
        </>
      ) : (
        <p class="notice">{t('home.state.comingSoon')}</p>
      )}
    </Layout>
  )
}

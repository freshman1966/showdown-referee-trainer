import { PASS_MARK, QUESTIONS_PER_RUN } from '../config'
import { levelPool, packs } from '../content'
import type { LevelId, Pack } from '../content/types'
import { formatEdition, t } from '../i18n'
import { Layout, PageHeading, navLinks, usePageTitle } from '../components/Layout'
import { href } from '../router'
import { practicePool, useApp } from '../state/app'
import { BADGE_ORDER, levelKey, levelState, type LevelState } from '../state/progress'
import { Badge } from '../components/Badge'

function LevelCard({ pack, levelId, state, isNext }: { pack: Pack; levelId: LevelId; state: LevelState; isNext: boolean }) {
  const { progress } = useApp()
  const name = t(`levels.${levelId}.name`)
  const best = progress.best[levelKey(pack.meta.id, levelId)]
  const levelIndex = pack.meta.levels.indexOf(levelId)
  const previous = pack.meta.levels[levelIndex - 1]
  const runInfo = t('home.runInfo', { count: QUESTIONS_PER_RUN, passMark: PASS_MARK })
  const target = href({ name: 'level', packId: pack.meta.id, levelId })

  let details: string
  if (state === 'locked') details = previous ? t('home.lockedHint', { previousLevel: t(`levels.${previous}.name`) }) : ''
  else if (state === 'comingSoon') details = t(`levels.${levelId}.description`)
  else if (best) details = `${t('home.bestScore', { player: best.player, rulebook: best.rulebook })} · ${runInfo}`
  else details = `${t(`levels.${levelId}.description`)} · ${runInfo}`

  return (
    <li class={`level-card level-card--${state}${isNext ? ' level-card--next' : ''}`}>
      <div class="level-card__head">
        <h3>
          {t(`levels.${levelId}.number`)} · {name}
        </h3>
        <span class={`state state--${state}`}>{t(`home.state.${state}`)}</span>
      </div>
      <p class="muted">{details}</p>
      {isNext ? (
        <a class="button button--accent" href={target}>
          {t('home.startLevel', { level: name })}
        </a>
      ) : state === 'passed' ? (
        <a class="text-link" href={target}>
          {t('home.playAgain')}
          <span class="visually-hidden">: {name}</span>
        </a>
      ) : state === 'unlocked' ? (
        <a class="text-link" href={target}>
          {t('home.startLevel', { level: name })}
        </a>
      ) : null}
    </li>
  )
}

export function Home() {
  const { progress, storageAvailable } = useApp()
  usePageTitle(t('app.name'))
  const locale = progress.settings.locale
  const edition = packs[0] ? formatEdition(packs[0].meta.edition) : ''
  const canPractice = practicePool(progress).length > 0

  return (
    <Layout nav={[navLinks.settings(), navLinks.about()]} isHome>
      <div class="stack">
        <PageHeading>{t('app.tagline')}</PageHeading>
        <p class="lead">{t('app.intro', { edition })}</p>
      </div>
      {!storageAvailable && <p class="notice">{t('settings.storageUnavailable')}</p>}

      {packs.map((pack) => {
        const states = pack.meta.levels.map((levelId) => levelState(progress, pack.meta, levelId, levelPool(pack, levelId, locale).length))
        // The highlighted "Start" card is the first open level that is not passed yet.
        const nextIndex = states.indexOf('unlocked')
        return (
          <section class="stack" key={pack.meta.id} aria-labelledby={`levels-${pack.meta.id}`}>
            <h2 id={`levels-${pack.meta.id}`}>
              {packs.length > 1 ? pack.meta.title[locale] ?? pack.meta.title[pack.meta.defaultLocale] : t('home.levelsHeading')}
            </h2>
            <ol class="level-list">
              {pack.meta.levels.map((levelId, i) => (
                <LevelCard key={levelId} pack={pack} levelId={levelId} state={states[i]} isNext={i === nextIndex} />
              ))}
            </ol>
          </section>
        )
      })}

      {progress.badges.length > 0 && (
        <section class="stack" aria-labelledby="badges-heading">
          <h2 id="badges-heading">{t('home.badgesHeading')}</h2>
          <ul class="badge-list">
            {BADGE_ORDER.filter((b) => progress.badges.includes(b)).map((b) => (
              <li key={b}>
                <Badge id={b} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {canPractice && (
        <p>
          <a class="text-link" href={href({ name: 'practice' })}>
            {t('home.practiceLink')}
          </a>
        </p>
      )}
    </Layout>
  )
}

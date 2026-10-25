import { packs } from '../content'
import { formatDate, formatEdition, t } from '../i18n'
import { Layout, PageHeading, navLinks, usePageTitle } from '../components/Layout'

export function About() {
  usePageTitle(t('about.heading'))
  const meta = packs[0]?.meta
  return (
    <Layout nav={[navLinks.home(), navLinks.settings()]}>
      <PageHeading>{t('about.heading')}</PageHeading>
      <p class="lead">{t('about.purpose')}</p>

      <section class="stack" aria-labelledby="edition-heading">
        <h2 id="edition-heading">{t('about.editionHeading')}</h2>
        {meta?.validFrom && meta.validTo && (
          <p>
            {t('about.editionText', {
              edition: formatEdition(meta.edition),
              validFrom: formatDate(meta.validFrom),
              validTo: formatDate(meta.validTo),
            })}
          </p>
        )}
        <p>
          <a class="text-link" href={t('about.rulesUrl')}>
            {t('about.rulesLink')}
          </a>
        </p>
        <p>{t('about.disclaimer')}</p>
      </section>

      <section class="stack" aria-labelledby="feedback-heading">
        <h2 id="feedback-heading">{t('about.feedbackHeading')}</h2>
        <p>{t('about.feedbackText')}</p>
        <p>{t('about.feedbackContact')}</p>
      </section>

      <section class="stack" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">{t('about.privacyHeading')}</h2>
        <p>{t('about.privacyText')}</p>
      </section>

      <section class="stack" aria-labelledby="credits-heading">
        <h2 id="credits-heading">{t('about.creditsHeading')}</h2>
        <p>{t('about.creditsText')}</p>
      </section>
    </Layout>
  )
}

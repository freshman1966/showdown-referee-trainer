import { t } from '../i18n'
import { Layout, PageHeading, navLinks, usePageTitle } from '../components/Layout'
import { href } from '../router'

export function NotFound() {
  usePageTitle(t('errors.notFound'))
  return (
    <Layout nav={[navLinks.settings(), navLinks.about()]}>
      <PageHeading>{t('errors.notFound')}</PageHeading>
      <p>
        <a class="text-link" href={href({ name: 'home' })}>
          {t('result.backToLevels')}
        </a>
      </p>
    </Layout>
  )
}

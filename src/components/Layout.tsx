import { useEffect } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { t } from '../i18n'
import { href, type Route } from '../router'

export interface NavLink {
  route: Route
  label: string
}

/** Sets document.title for the current screen. */
export function usePageTitle(title: string): void {
  useEffect(() => {
    const app = t('app.name')
    document.title = title === app ? `${app} – ${t('app.subtitle')}` : `${title} – ${app}`
  }, [title])
}

export function SkipLink() {
  // Hash routing: move focus without changing the URL.
  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    document.getElementById('main')?.focus()
  }
  return (
    <a class="skip-link" href="#main" onClick={onClick}>
      {t('nav.skipToContent')}
    </a>
  )
}

export function PreviewBanner() {
  return __PREVIEW__ ? <p class="preview-banner">{t('app.previewBanner')}</p> : null
}

export function PageHeading({ children, class: className }: { children: ComponentChildren; class?: string }) {
  return (
    <h1 id="page-title" tabIndex={-1} class={className}>
      {children}
    </h1>
  )
}

/** Shell for all screens except the question screen: skip link, preview banner, dark header, footer. */
export function Layout({
  nav,
  isHome = false,
  children,
}: {
  nav: NavLink[]
  isHome?: boolean
  children: ComponentChildren
}) {
  return (
    <>
      <SkipLink />
      <header>
        <PreviewBanner />
        <div class="site-header">
        <div class="site-header__inner">
          {isHome ? (
            <p class="brand">{t('app.name')}</p>
          ) : (
            <a class="brand" href={href({ name: 'home' })}>
              {t('app.name')}
            </a>
          )}
          {nav.length > 0 && (
            <nav aria-label={t('app.name')}>
              <ul class="site-nav">
                {nav.map((link) => (
                  <li key={link.label}>
                    <a href={href(link.route)}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} class="page">
        {children}
      </main>
      <footer class="site-footer">
        <p>{t('app.disclaimer')}</p>
      </footer>
    </>
  )
}

export const navLinks = {
  home: (): NavLink => ({ route: { name: 'home' }, label: t('nav.home') }),
  settings: (): NavLink => ({ route: { name: 'settings' }, label: t('nav.settings') }),
  about: (): NavLink => ({ route: { name: 'about' }, label: t('nav.about') }),
  done: (): NavLink => ({ route: { name: 'home' }, label: t('nav.done') }),
}

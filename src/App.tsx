import { useEffect, useRef } from 'preact/hooks'
import { AnnouncerProvider } from './components/Announcer'
import { getLocale, setLocale } from './i18n'
import { useRoute, type Route } from './router'
import { About } from './screens/About'
import { Home } from './screens/Home'
import { LevelStart, PracticeStart } from './screens/LevelStart'
import { NotFound } from './screens/NotFound'
import { Play } from './screens/Play'
import { Result } from './screens/Result'
import { Settings } from './screens/Settings'
import { AppProvider, useApp } from './state/app'
import type { Store } from './state/storage'
import type { Rng } from './game/draw'
import { watchTheme } from './theme'

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <Home />
    case 'level':
      return <LevelStart packId={route.packId} levelId={route.levelId} />
    case 'practice':
      return <PracticeStart />
    case 'play':
      return <Play />
    case 'result':
      return <Result />
    case 'settings':
      return <Settings />
    case 'about':
      return <About />
    case 'notFound':
      return <NotFound />
  }
}

function Shell() {
  const route = useRoute()
  const { progress } = useApp()
  const { theme, locale } = progress.settings
  const routeKey = JSON.stringify(route)
  const firstRender = useRef(true)

  useEffect(() => watchTheme(theme), [theme])

  useEffect(() => {
    setLocale(locale)
    document.documentElement.lang = getLocale()
  }, [locale])

  // Focus the new screen's h1 after navigation, but not on first load (spec 5).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo(0, 0)
    document.getElementById('page-title')?.focus()
  }, [routeKey])

  return <Screen route={route} />
}

export function App({ store, rng }: { store: Store; rng?: Rng }) {
  return (
    <AppProvider store={store} rng={rng}>
      <AnnouncerProvider>
        <Shell />
      </AnnouncerProvider>
    </AppProvider>
  )
}

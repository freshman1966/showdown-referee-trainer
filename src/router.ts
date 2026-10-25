import { useEffect, useState } from 'preact/hooks'

export type Route =
  | { name: 'home' }
  | { name: 'level'; packId: string; levelId: string }
  | { name: 'practice' }
  | { name: 'play' }
  | { name: 'result' }
  | { name: 'settings' }
  | { name: 'about' }
  | { name: 'notFound' }

// Hash routes keep the site static: every URL serves index.html.
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  const [head, ...rest] = parts
  switch (head) {
    case undefined:
      return { name: 'home' }
    case 'level':
      return rest.length === 2 ? { name: 'level', packId: rest[0], levelId: rest[1] } : { name: 'notFound' }
    case 'practice':
    case 'play':
    case 'result':
    case 'settings':
    case 'about':
      return rest.length === 0 ? { name: head } : { name: 'notFound' }
    default:
      return { name: 'notFound' }
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'level':
      return `#/level/${encodeURIComponent(route.packId)}/${encodeURIComponent(route.levelId)}`
    case 'notFound':
      return '#/'
    default:
      return `#/${route.name}`
  }
}

export function navigate(route: Route, replace = false): void {
  const target = href(route)
  if (replace) history.replaceState(null, '', target)
  else location.hash = target
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'))
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

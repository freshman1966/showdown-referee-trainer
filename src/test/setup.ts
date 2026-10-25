import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/preact'

;(globalThis as { __PREVIEW__?: boolean }).__PREVIEW__ = true

afterEach(() => {
  cleanup()
  localStorage.clear()
  location.hash = ''
})

// jsdom lacks these browser APIs.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia
window.scrollTo = () => {}

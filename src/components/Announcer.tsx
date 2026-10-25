import { createContext } from 'preact'
import { useCallback, useContext, useMemo, useRef, useState } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

type Politeness = 'polite' | 'assertive'
type Announce = (message: string, politeness?: Politeness) => void

const AnnounceContext = createContext<Announce>(() => {})

export const useAnnounce = () => useContext(AnnounceContext)

/**
 * Two visually hidden live regions (spec 5): polite for score and feedback,
 * assertive only for the timer running out.
 */
export function AnnouncerProvider({ children }: { children: ComponentChildren }) {
  const [messages, setMessages] = useState({ polite: '', assertive: '' })
  const timers = useRef<Partial<Record<Politeness, number>>>({})
  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    // Clear first so the same text is announced again.
    setMessages((m) => ({ ...m, [politeness]: '' }))
    window.clearTimeout(timers.current[politeness])
    timers.current[politeness] = window.setTimeout(() => setMessages((m) => ({ ...m, [politeness]: message })), 50)
  }, [])
  const value = useMemo(() => announce, [announce])
  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div class="visually-hidden" aria-live="polite" aria-atomic="true">
        {messages.polite}
      </div>
      <div class="visually-hidden" aria-live="assertive" aria-atomic="true">
        {messages.assertive}
      </div>
    </AnnounceContext.Provider>
  )
}

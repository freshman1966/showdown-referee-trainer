// WCAG contrast of the theme tokens (docs/design/tokens.json): text 4.5:1, UI parts and focus 3:1.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const tokens = JSON.parse(readFileSync(join(import.meta.dirname, '../docs/design/tokens.json'), 'utf8'))

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [foreground, background, minimum, where]
const PAIRS: [string, string, number, string][] = [
  ['ink', 'ground', 4.5, 'body text'],
  ['ink', 'surface', 4.5, 'card and option text'],
  ['muted', 'ground', 4.5, 'footer, eyebrow'],
  ['muted', 'surface', 4.5, 'hints, neutral options'],
  ['muted', 'surfaceDisabled', 4.5, 'locked level text'],
  ['ink', 'surfaceDisabled', 4.5, 'locked level heading'],
  ['onHeader', 'header', 4.5, 'header text'],
  ['onHeaderMuted', 'header', 4.5, 'panel meta text'],
  ['headerAccent', 'header', 4.5, 'streak, badge label'],
  ['accent', 'surface', 4.5, '"Unlocked" state text'],
  ['onAccent', 'accent', 4.5, 'accent button'],
  ['onPrimaryButton', 'primaryButton', 4.5, 'primary button'],
  ['correct', 'surface', 4.5, '"Passed", feedback heading'],
  ['correct', 'correctBg', 4.5, 'correct option label'],
  ['ink', 'correctBg', 4.5, 'correct option text'],
  ['incorrect', 'surface', 4.5, 'feedback heading, reset button'],
  ['incorrect', 'incorrectBg', 4.5, 'incorrect option label'],
  ['ink', 'incorrectBg', 4.5, 'incorrect option text'],
  ['incorrect', 'ground', 4.5, 'form error'],
  ['border', 'surface', 3, 'option and card borders'],
  ['focus', 'ground', 3, 'focus ring on page'],
  ['focus', 'surface', 3, 'focus ring on cards'],
  ['headerAccent', 'header', 3, 'focus ring in header'],
  ['progressFill', 'progressTrack', 3, 'progress bar'],
]

// Where src/styles.css deliberately overrides a token value.
const OVERRIDES: Record<string, Record<string, string>> = {
  highContrast: { progressTrack: '#000000' },
}

describe.each(Object.keys(tokens.themes))('theme %s', (name) => {
  const theme = { ...tokens.themes[name], ...OVERRIDES[name] } as Record<string, string>
  it.each(PAIRS)('%s on %s ≥ %s:1 (%s)', (fg, bg, min) => {
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(min)
  })
})

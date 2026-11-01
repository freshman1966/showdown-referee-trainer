import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/preact'
import { makeQuestion } from '../test/fixtures'

const question = makeQuestion({ id: 'N-024', version: 2, level: 'national' })

vi.mock('virtual:content', () => ({
  packs: [{ meta: { id: 'core-2026', contentVersion: '2026-11-01.1' }, questions: { en: [question] } }],
  review: {
    formUrl: 'https://docs.google.com/forms/d/e/FORM/viewform',
    entryQuestionKey: 'entry.111',
    entrySetVersion: 'entry.222',
  },
}))

const { CommentLink, commentUrl } = await import('./CommentLink')

describe('CommentLink', () => {
  it('pre-fills question key and set version (spec 13.3)', () => {
    expect(commentUrl(question)).toBe(
      'https://docs.google.com/forms/d/e/FORM/viewform?usp=pp_url&entry.111=N-024%20v2&entry.222=2026-11-01.1',
    )
  })

  it('opens in a new tab and says so in the link text', () => {
    render(<CommentLink question={question} />)
    const link = screen.getByRole('link', { name: 'Comment on this question (opens Google Form in a new tab)' })
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })
})

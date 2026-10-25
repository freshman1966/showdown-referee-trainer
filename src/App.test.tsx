import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import axe from 'axe-core'
import { packs } from 'virtual:content'
import { App } from './App'
import { createStore } from './state/storage'
import { seeded } from './test/fixtures'
import { STORAGE_KEY } from './config'

const allQuestions = packs.flatMap((p) => Object.values(p.questions)[0])

async function expectNoAxeViolations() {
  // jsdom cannot compute colours; contrast is checked separately against the tokens.
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
}

async function go(hash: string) {
  location.hash = hash
  await new Promise((r) => setTimeout(r, 0))
}

function currentQuestion() {
  const form = document.querySelector<HTMLFormElement>('form[data-question-id]')!
  return allQuestions.find((q) => q.id === form.dataset.questionId)!
}

function choose(optionIds: string[]) {
  const q = currentQuestion()
  for (const id of optionIds) {
    const text = q.options.find((o) => o.id === id)!.text
    fireEvent.click(screen.getByLabelText(text))
  }
}

describe('App', () => {
  it('plays a full Trainee level and passes', async () => {
    render(<App store={createStore()} rng={seeded(3)} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Make the right call.' })).toBeTruthy()
    expect(screen.getByText('PREVIEW – draft content, not reviewed')).toBeTruthy()
    await expectNoAxeViolations()

    fireEvent.click(screen.getByRole('link', { name: 'Start Trainee' }))
    await screen.findByRole('heading', { level: 1, name: 'Trainee' })
    await waitFor(() => expect(document.activeElement?.id).toBe('page-title'))
    await expectNoAxeViolations()

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    await screen.findByText('Trainee · Serve 1 of 12', { selector: 'h1' })
    await expectNoAxeViolations()

    for (let i = 0; i < 12; i++) {
      const q = currentQuestion()
      // Get two wrong on purpose: 10 of 12 is the pass mark.
      const wrong = i < 2
      choose(wrong ? [q.options.find((o) => !q.correct.includes(o.id))!.id] : q.correct)
      fireEvent.click(screen.getByRole('button', { name: 'Submit answer' }))
      const heading = await screen.findByRole('heading', { level: 2, name: wrong ? 'Incorrect. Point for the Rulebook.' : 'Correct. Goal for you.' })
      await waitFor(() => expect(document.activeElement).toBe(heading))
      expect(screen.getByRole('group')).toHaveProperty('disabled', true)
      if (i === 0) {
        expect(screen.getAllByText('Your answer · incorrect').length).toBeGreaterThan(0)
        await expectNoAxeViolations()
      }
      fireEvent.click(screen.getByRole('button', { name: i === 11 ? 'See result' : 'Next serve' }))
      if (i < 11) await waitFor(() => expect(document.activeElement?.id).toBe('page-title'))
    }

    await screen.findByRole('heading', { level: 1, name: 'Passed' })
    expect(screen.getByText('10 of 12 correct. Pass mark: 10.')).toBeTruthy()
    expect(screen.getByText('Trainee Referee')).toBeTruthy()
    expect(screen.getByText('National level unlocked.')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'To review (2)' })).toBeTruthy()
    await expectNoAxeViolations()

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.passed).toEqual(['core-2026/trainee'])
    expect(stored.unlocked).toEqual(['core-2026/national'])
    expect(stored.wrongIds).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Show all 12 answers' }))
    expect(screen.getByRole('button', { name: 'Hide answers' }).getAttribute('aria-expanded')).toBe('true')
    await expectNoAxeViolations()

    fireEvent.click(screen.getByRole('link', { name: 'Back to levels' }))
    await screen.findByRole('heading', { level: 1, name: 'Make the right call.' })
    expect(screen.getByRole('link', { name: 'Start National' })).toBeTruthy()
    expect(screen.getByText('Your badges')).toBeTruthy()
  })

  it('asks for a selection before submitting', async () => {
    render(<App store={createStore()} rng={seeded(1)} />)
    await go('#/level/core-2026/trainee')
    fireEvent.click(await screen.findByRole('button', { name: 'Start' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Submit answer' }))
    expect(screen.getByText('Select an answer first.')).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('keeps locked levels closed', async () => {
    render(<App store={createStore()} />)
    await go('#/level/core-2026/international')
    expect(await screen.findByText('Pass National to unlock.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
  })

  it.each(['#/settings', '#/about', '#/practice', '#/nowhere'])('renders %s without axe violations', async (hash) => {
    render(<App store={createStore()} />)
    await go(hash)
    await screen.findByRole('heading', { level: 1 })
    await expectNoAxeViolations()
  })

  it('changes theme and timer from settings', async () => {
    render(<App store={createStore()} />)
    await go('#/settings')
    fireEvent.click(await screen.findByLabelText('High contrast'))
    fireEvent.click(screen.getByLabelText('45 s'))
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('high-contrast'))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).settings).toMatchObject({ theme: 'high-contrast', timer: 45 })
  })
})

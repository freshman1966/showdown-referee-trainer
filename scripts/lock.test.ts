import { describe, expect, it } from 'vitest'
import { readRawPacks, readUiStrings } from './content.ts'
import { questionsCsv } from './export-questions.ts'
import { extendLock, questionHash, questionKey } from './lock.ts'
import { validateContent } from './validate.ts'
import { makeQuestion } from '../src/test/fixtures.ts'

const ui = readUiStrings()

describe('question lock', () => {
  it('hashes only player-visible fields, independent of key order', () => {
    const q = makeQuestion({ interpretation: null })
    const { interpretation: _, ...withoutInterpretation } = q
    const reordered = Object.fromEntries(Object.entries(q).reverse()) as typeof q
    expect(questionHash(reordered)).toBe(questionHash(q))
    expect(questionHash(withoutInterpretation)).toBe(questionHash(q))
    expect(questionHash({ ...q, status: 'approved', difficulty: 3, topics: ['faults'], reviewNote: 'x' })).toBe(questionHash(q))
    expect(questionHash({ ...q, prompt: 'Changed?' })).not.toBe(questionHash(q))
    expect(questionHash({ ...q, interpretation: 'New.' })).not.toBe(questionHash(q))
  })

  it('adds new keys and never overwrites existing ones', () => {
    const q = makeQuestion()
    const { lock, added } = extendLock({ [questionKey(q)]: 'old' }, [q, { ...q, version: 2, prompt: 'New?' }])
    expect(lock[questionKey(q)]).toBe('old')
    expect(added).toEqual([`${q.id} v2`])
  })

  it('fails validation when locked text changes without a version increase', () => {
    const packs = readRawPacks()
    const q = (packs[0].questions.en as any[])[0]
    q.prompt = 'Edited without a version bump?'
    expect(validateContent(packs, ui, 'preview').errors).toEqual([
      `packs/core-2026 ${q.id} v${q.version}: player-visible text changed without a version increase; set "version" to ${q.version + 1}`,
    ])
  })

  it('accepts the change once the version is increased, and asks for the lock to be updated', () => {
    const packs = readRawPacks()
    const q = (packs[0].questions.en as any[])[0]
    q.prompt = 'Edited with a version bump?'
    q.version += 1
    const report = validateContent(packs, ui, 'preview')
    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([`packs/core-2026 ${q.id} v${q.version}: not in question-lock.json; run npm run content:lock`])
  })

  it('fails validation without a lock file', () => {
    const packs = readRawPacks()
    delete packs[0].lock
    expect(validateContent(packs, ui, 'preview').errors.join('\n')).toMatch(/question-lock\.json is missing/)
  })
})

describe('review.json', () => {
  const config = { enabled: true, formUrl: '', entryQuestionKey: '', entrySetVersion: '' }

  it('accepts an empty form URL', () => {
    expect(validateContent(readRawPacks(), ui, 'preview', config).errors).toEqual([])
  })

  it('requires entry ids once the form URL is set', () => {
    const errors = validateContent(readRawPacks(), ui, 'preview', { ...config, formUrl: 'https://docs.google.com/forms/d/e/x/viewform' }).errors
    expect(errors).toEqual([
      'review.json: "entryQuestionKey" must look like "entry.123456789" when formUrl is set',
      'review.json: "entrySetVersion" must look like "entry.123456789" when formUrl is set',
    ])
  })
})

describe('questionsCsv', () => {
  it('writes the spec 13.4 columns with RFC 4180 quoting', () => {
    const q = makeQuestion({
      id: 'N-024',
      version: 2,
      level: 'national',
      topics: ['serve', 'faults'],
      scenario: 'Player A says "out", then serves.',
      prompt: 'What is the decision?',
      options: [
        { id: 'a', text: 'Re-serve' },
        { id: 'b', text: '1 point, Player B' },
      ],
      correct: ['b'],
      explanation: 'Because.',
      ruleRefs: ['6', '16.3.7'],
    })
    const [header, ...rest] = questionsCsv([q], '2026-11-01.1').split('\r\n')
    expect(header).toBe('key,id,version,setVersion,level,topics,status,scenario,prompt,options,correct,explanation,interpretation,ruleRefs')
    expect(rest.join('\r\n')).toBe(
      'N-024 v2,N-024,2,2026-11-01.1,national,serve; faults,approved,"Player A says ""out"", then serves.",What is the decision?,' +
        '"a) Re-serve\nb) 1 point, Player B","1 point, Player B",Because.,,6; 16.3.7\r\n',
    )
  })
})

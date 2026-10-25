import { describe, expect, it } from 'vitest'
import { readRawPacks, readUiStrings, type RawPack } from './content.ts'
import { validateContent } from './validate.ts'

const clone = <T>(v: T): T => structuredClone(v)

function withQuestions(edit: (questions: any[]) => void, extraLocales: Record<string, any[]> = {}): RawPack[] {
  const packs = clone(readRawPacks())
  edit(packs[0].questions.en as any[])
  Object.assign(packs[0].questions, extraLocales)
  return packs
}

const ui = readUiStrings()

describe('validateContent', () => {
  it('accepts the repository content in preview mode', () => {
    expect(validateContent(readRawPacks(), ui, 'preview').errors).toEqual([])
  })

  it('accepts a production build without approved questions (levels are "coming soon")', () => {
    const report = validateContent(readRawPacks(), ui, 'production')
    expect(report.errors).toEqual([])
    expect(report.warnings.join('\n')).toContain('coming soon')
  })

  it('fails production when a level has some but too few approved questions', () => {
    const packs = withQuestions((qs) => qs.filter((q) => q.level === 'trainee').slice(0, 5).forEach((q) => (q.status = 'approved')))
    expect(validateContent(packs, ui, 'production').errors.join('\n')).toMatch(/trainee: 5 approved questions, a run needs 12/)
  })

  it.each([
    ['duplicate ids', (qs: any[]) => (qs[1].id = qs[0].id), /duplicate id/],
    ['unknown correct id', (qs: any[]) => (qs[0].correct = ['z']), /correct id "z" is not an option/],
    ['single with two answers', (qs: any[]) => (qs[0].correct = ['a', 'b']), /exactly one correct option/],
    ['unknown topic', (qs: any[]) => (qs[0].topics = ['juggling']), /topics\/0/],
    ['duplicate topic', (qs: any[]) => (qs[0].topics = ['serve', 'serve']), /topics/],
    ['empty topics', (qs: any[]) => (qs[0].topics = []), /topics/],
    ['unknown importance', (qs: any[]) => (qs[0].importance = 'huge'), /importance/],
    ['wrong id prefix', (qs: any[]) => (qs[0].id = 'N-999'), /prefix/],
    ['requiresVision without media', (qs: any[]) => (qs[0].requiresVision = true), /requiresVision/],
  ])('rejects %s', (_name, edit, pattern) => {
    expect(validateContent(withQuestions(edit), ui, 'preview').errors.join('\n')).toMatch(pattern)
  })

  it('rejects a translation whose non-text fields differ', () => {
    const packs = withQuestions(() => {})
    const de = clone(packs[0].questions.en as any[])
    de[0].correct = ['c']
    de.pop()
    packs[0].questions.de = de
    const errors = validateContent(packs, ui, 'preview').errors.join('\n')
    expect(errors).toMatch(/"correct" in questions\.de\.json differs/)
    expect(errors).toMatch(/missing in questions\.de\.json/)
  })
})

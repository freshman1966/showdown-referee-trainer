import { describe, expect, it } from 'vitest'
import { buildCumulative, cumulativeForPacks, parseCsv, readExports } from './cumulative.ts'
import { readRawPacks } from './content.ts'
import { questionsCsv } from './export-questions.ts'
import { makeQuestion } from '../src/test/fixtures.ts'

const a1 = makeQuestion({ id: 'T-101', prompt: 'A, "quoted"?' })
const b1 = makeQuestion({ id: 'T-102' })
const b2 = { ...b1, version: 2, prompt: 'B changed?' }
const c1 = makeQuestion({ id: 'T-103' })

const file = (setVersion: string, ...qs: ReturnType<typeof makeQuestion>[]) => ({
  name: `questions-${setVersion}.csv`,
  content: questionsCsv(qs, setVersion),
})

const keys = (csv: string) => parseCsv(csv).slice(1).map((r) => r[0])

describe('cumulative review file', () => {
  it('keeps every key once, in order of first appearance, oldest set first', () => {
    // Passed out of order: .10 sorts after .2, and dates before counters.
    const files = [file('2026-11-01.10', b2, a1, c1), file('2026-10-30.1', b1), file('2026-11-01.2', a1, b1)]
    const result = buildCumulative(files)
    expect(result.errors).toEqual([])
    expect(keys(result.csv)).toEqual(['T-102 v1', 'T-101 v1', 'T-102 v2', 'T-103 v1'])
    // The first export of a key wins, including its set version.
    expect(parseCsv(result.csv)[1][3]).toBe('2026-10-30.1')
  })

  it('round-trips quoting and line breaks unchanged', () => {
    const single = file('2026-11-01.1', a1)
    expect(buildCumulative([single]).csv).toBe(single.content)
  })

  it('rejects two exports with different text under the same key', () => {
    const changed = { ...a1, prompt: 'Edited without a version bump?' }
    const { errors } = buildCumulative([file('2026-11-01.1', a1), file('2026-11-01.2', changed)])
    expect(errors).toEqual(['exports/questions-2026-11-01.2.csv T-101 v1: "prompt" differs from an earlier export of the same key'])
  })

  it('covers every current question key in the committed exports', () => {
    const result = cumulativeForPacks(readRawPacks(), readExports())
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })
})

export type LevelId = 'trainee' | 'national' | 'international'

export type Topic =
  | 'match-format'
  | 'serve'
  | 'faults'
  | 'goal-area'
  | 'dead-ball'
  | 'time-outs'
  | 'change-sides'
  | 'warnings-penalties'
  | 'equipment'
  | 'procedures'
  | 'signals'
  | 'team-play'

export type QuestionStatus = 'draft' | 'reviewed' | 'approved'

export interface Option {
  id: string
  text: string
}

export interface Media {
  type: 'svg'
  src: string
  alt: string
  description?: string
}

export interface Question {
  id: string
  level: LevelId
  topics: Topic[]
  importance: 'critical' | 'standard'
  frequency: 'common' | 'rare'
  type: 'single' | 'multiple'
  difficulty: 1 | 2 | 3
  edition: string
  status: QuestionStatus
  prompt: string
  scenario: string | null
  options: Option[]
  correct: string[]
  fixedOrder: boolean
  explanation: string
  ruleRefs: string[]
  media: Media | null
  requiresVision: boolean
  reviewNote?: string | null
}

export interface PackMeta {
  id: string
  title: Record<string, string>
  edition: string
  validFrom?: string
  validTo?: string
  levels: LevelId[]
  defaultLocale: string
}

/** A pack as shipped to the browser: questions per locale, filtered for the build mode, no review notes. */
export interface Pack {
  meta: PackMeta
  questions: Record<string, Question[]>
}

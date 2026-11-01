/// <reference types="vitest/config" />

/** True in dev, `--mode preview` and Cloudflare Pages branch deploys. */
declare const __PREVIEW__: boolean

declare module 'virtual:content' {
  export const packs: import('./content/types').Pack[]
  /** Comment-link settings from content/review.json; null in production or while the form URL is empty. */
  export const review: { formUrl: string; entryQuestionKey: string; entrySetVersion: string } | null
}

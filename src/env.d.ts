/// <reference types="vitest/config" />

/** True in dev, `--mode preview` and Cloudflare Pages branch deploys. */
declare const __PREVIEW__: boolean

declare module 'virtual:content' {
  export const packs: import('./content/types').Pack[]
}

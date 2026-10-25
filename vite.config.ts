import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Preview builds include draft questions and show the preview banner (spec 6.3, 8).
// Cloudflare Pages sets CF_PAGES_BRANCH; every branch except main is a preview deploy.
const PRODUCTION_BRANCH = 'main'

export default defineConfig(({ command, mode }) => {
  const branch = process.env.CF_PAGES_BRANCH
  const isPreview =
    command === 'serve' ||
    mode === 'preview' ||
    (branch !== undefined && branch !== PRODUCTION_BRANCH)

  return {
    plugins: [preact()],
    define: {
      __PREVIEW__: JSON.stringify(isPreview),
    },
    build: {
      target: 'es2022',
    },
  }
})

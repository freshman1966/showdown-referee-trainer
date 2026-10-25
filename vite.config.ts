import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolveBuildMode } from './scripts/build-mode.ts'
import { contentPlugin } from './scripts/content-plugin.ts'

export default defineConfig(({ command, mode }) => {
  const buildMode = resolveBuildMode({ serve: command === 'serve', mode })

  return {
    plugins: [preact(), contentPlugin(buildMode)],
    define: {
      __PREVIEW__: JSON.stringify(buildMode === 'preview'),
    },
    build: {
      target: 'es2022',
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
      setupFiles: ['src/test/setup.ts'],
    },
  }
})

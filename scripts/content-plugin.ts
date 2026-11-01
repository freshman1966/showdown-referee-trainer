import type { Plugin } from 'vite'
import type { BuildMode } from './build-mode.ts'
import { buildPacks, readRawPacks, readReviewConfig, readUiStrings, shippedReviewConfig, CONTENT_DIR } from './content.ts'
import { CUMULATIVE_PATH, cumulativeForPacks } from './cumulative.ts'
import { validateContent } from './validate.ts'

const ID = 'virtual:content'
const RESOLVED_ID = '\0' + ID

/** Serves validated question packs (and the review-mode config) as `virtual:content`, filtered for the build mode. */
export function contentPlugin(mode: BuildMode): Plugin {
  return {
    name: 'showdown-content',
    resolveId(id) {
      return id === ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const { errors, warnings } = validateContent(readRawPacks(), readUiStrings(), mode)
      for (const w of warnings) this.warn(w)
      if (errors.length > 0) this.error(`Content validation failed:\n${errors.join('\n')}`)
      const review = shippedReviewConfig(mode, readReviewConfig())
      return [
        `export const packs = ${JSON.stringify(buildPacks(mode))}`,
        `export const review = ${JSON.stringify(review && { formUrl: review.formUrl, entryQuestionKey: review.entryQuestionKey, entrySetVersion: review.entrySetVersion })}`,
      ].join('\n')
    },
    generateBundle() {
      // Review sheet source (spec 13.4): preview builds only.
      if (mode !== 'preview') return
      const { csv, errors, warnings } = cumulativeForPacks(readRawPacks())
      for (const w of warnings) this.warn(w)
      if (errors.length > 0) this.error(`Export check failed:\n${errors.join('\n')}`)
      this.emitFile({ type: 'asset', fileName: CUMULATIVE_PATH, source: csv })
    },
    configureServer(server) {
      server.middlewares.use(`/${CUMULATIVE_PATH}`, (_req, res) => {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.end(cumulativeForPacks(readRawPacks()).csv)
      })
      server.watcher.add(CONTENT_DIR)
      server.watcher.on('change', (file) => {
        if (!file.startsWith(CONTENT_DIR) || !(file.includes('/packs/') || file.endsWith('review.json'))) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

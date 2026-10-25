import type { Plugin } from 'vite'
import type { BuildMode } from './build-mode.ts'
import { buildPacks, readRawPacks, readUiStrings, CONTENT_DIR } from './content.ts'
import { validateContent } from './validate.ts'

const ID = 'virtual:content'
const RESOLVED_ID = '\0' + ID

/** Serves validated question packs as `virtual:content`, filtered for the build mode. */
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
      return `export const packs = ${JSON.stringify(buildPacks(mode))}`
    },
    configureServer(server) {
      server.watcher.add(CONTENT_DIR)
      server.watcher.on('change', (file) => {
        if (!file.startsWith(CONTENT_DIR) || !file.includes('/packs/')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

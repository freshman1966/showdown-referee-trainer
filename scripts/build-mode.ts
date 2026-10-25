// Preview builds include draft questions and show the preview banner (spec 6.3, 8).
// Cloudflare Pages sets CF_PAGES_BRANCH; every branch except main is a preview deploy.
export const PRODUCTION_BRANCH = 'main'

export type BuildMode = 'production' | 'preview'

export function resolveBuildMode(opts: { serve?: boolean; mode?: string } = {}): BuildMode {
  if (opts.serve || opts.mode === 'preview') return 'preview'
  const branch = process.env.CF_PAGES_BRANCH
  if (branch !== undefined && branch !== PRODUCTION_BRANCH) return 'preview'
  return 'production'
}

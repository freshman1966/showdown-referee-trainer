# Call it. – Showdown Rules Quiz

A free, accessible web quiz that trains Showdown referees on the IBSA Showdown Rules 2026–2028.
Not an official IBSA publication. The IBSA rulebook is the binding source.

Spec: [docs/game-design-spec.md](docs/game-design-spec.md) · Decisions: [docs/decisions.md](docs/decisions.md)

## Development

Requires Node 22.12 or later.

```sh
npm install
npm run dev            # dev server, includes draft questions
npm run build          # production build: approved questions only
npm run build:preview  # preview build: all questions, preview banner
```

## Deployment (Cloudflare Pages)

Connect the GitHub repository in the Cloudflare dashboard (Workers & Pages → Create → Pages → Connect to Git):

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |

Node version comes from `.node-version`. Every branch other than `main` deploys as a preview: `vite.config.ts` reads `CF_PAGES_BRANCH` and enables draft content and the preview banner. Response headers are in `public/_headers`.

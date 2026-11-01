# Showdown Rules Quiz – instructions for Claude Code

## Roles
- Game design and quiz content: Cowork (Stefan's design sessions). Content and design decisions are made there.
- Implementation: Claude Code (this repository).

## Read first
1. `docs/game-design-spec.md` – the binding spec for v1 (screens, game rules, accessibility, data model, hosting, visual design in section 12).
2. `docs/decisions.md` – decisions log.
3. `docs/design/tokens.json` – colours, type, spacing for the three themes.

## Content
- Questions live in `content/packs/<pack-id>/questions.<locale>.json`. Pack metadata in `pack.json`.
- Do not change question text, answers or rule references. Report suspected content errors instead of fixing them.
- Questions with `status` other than `approved` must not appear in the production build.
- `reviewNote` is never shipped.

## Constraints
- Accessibility (WCAG 2.2 AA, screen readers) is a release requirement, not a nice-to-have.
- Static site only, deployed on Cloudflare Pages. No backend, no cookies, no accounts.
- All UI strings in `content/i18n/ui.<locale>.json` (English file provided); no hard-coded user-facing text. If a string is missing, add it to `ui.en.json` and list it in your summary so Cowork can review the wording.

## Open tasks for Claude Code
- Set up the Vite + TypeScript project in this folder (this folder is the repository root) and the Cloudflare Pages configuration.
- Write `schema/pack.schema.json` and `schema/questions.schema.json` from section 6 of the spec.
- Write the validator (`npm run validate`) from section 6.4.
- Build v1 as specified. All questions are `draft` until Stefan approves them. This is expected: develop with `CONTENT_MODE=preview` (spec 6.4). In production mode, levels without enough approved questions show "Coming soon".
- New optional question field `interpretation` (spec 6.3, schema updated by Cowork): render it in the feedback panel below the explanation and in the result review list, using `feedback.interpretationHeading` / `feedback.interpretationLabel`. Add it to the translatable text fields in the validator and to the TypeScript types.
- Review mode (spec section 13, preview builds only):
  - versions: `version` per question and `contentVersion` in `pack.json` are in the content (schema updated by Cowork); show the set version in the preview footer.
  - lock check: `question-lock.json`, `npm run content:lock`, validator check (13.1). Create the initial lock from the current content (all questions are v1).
  - "All questions" page at `/review` (13.2) and "Comment on this question" links (13.3), configured by `content/review.json` (form URL still empty: links hidden until Cowork fills it).
  - CSV export `npm run export:questions` (13.4).
  - UI strings are in `ui.en.json` under `review`.
- After that: run validate and tests, deploy a new preview.
- Publish `/review/questions-all.csv` in every preview build (spec 13.4, "Cumulative file"): built from all `exports/*.csv`, one row per question key, append order, never reordered. Commit the `exports/` files. Comment links: `content/review.json` is now filled in.

# Showdown Rules Quiz – Game Design Spec v0.1 (draft)

Status: draft for review by Stefan · Date: 2026-10-25
Audience: Claude Code (implementation)

## 1. Goal

A free, public web quiz that trains new and experienced Showdown referees on the IBSA Showdown Rules. It must be challenging, explain every answer with a rule reference, and be fully usable with a screen reader.

Audience:
- Primary: referees. Referees are fully sighted (rule 7.1).
- Secondary: blind and visually impaired players, coaches, and anyone interested in the rules. The quiz is public and must be fully usable by them.

## 2. Rule basis

- Edition: **IBSA Showdown Rules 2026–2028** (approved by the IBSA Executive Board on 13 October 2025, valid from 1 February 2026 to 31 December 2028).
- Source: https://fileservice.aifdigitalsolutions.com/ibsa/IBSA%20Showdown%20Rules%202026-2028_20260627105158866.pdf
- Every question carries the edition it was written for (`edition` field).
- Later packs can cover rule changes between editions (e.g. 2022–2025 → 2026–2028, and the next rule set after 2028). The data model supports this from day one (see 6.3).

## 3. Game structure

### 3.1 Levels

| Level | Unlock | Content focus | Pool (v1) | Questions per run | Pass mark |
|---|---|---|---|---|---|
| 1 Trainee | open | Core rules: match format, scoring values, serve, basic faults, time-outs, signals | 20 | 12 | 10 of 12 |
| 2 National | pass Trainee | Match scenarios, combined situations, warnings vs. penalties, procedures | 20 | 12 | 10 of 12 |
| 3 International | pass National | Edge cases, sequences of events, team play, equipment limits, official procedures | 20 | 12 | 10 of 12 |

- A run draws 12 questions at random from the level pool, with at least one question from each topic present in the pool where possible.
- Answer options are shuffled on every run, except options with `"fixedOrder": true` on the question.
- All levels stay replayable after they are unlocked.
- A "Practice all unlocked" mode draws from all unlocked pools, has no pass mark, and does not count towards progress.

### 3.1a Question selection in a run

- Draw is weighted: questions with `importance: "critical"` have weight 2, `standard` weight 1. Questions with `frequency: "rare"` get an additional +1.
- Questions the player answered wrong in an earlier run (stored locally, see 7) get an additional +2 until they are answered correctly once.
- At least one question per topic present in the pool, where possible (primary topic = first entry of `topics`).

### 3.1b Focus training (planned for v1.1, data model ready in v1)

- The player selects one topic (e.g. "Warnings & penalties") or the filter "Critical & rare situations".
- The run draws from all unlocked levels, filtered by `topics` (any position in the array) or by `importance: "critical"` + `frequency: "rare"`.
- 10 questions per run, no pass mark, does not unlock levels. Best score per focus is stored.

### 3.2 Run flow

1. Level start screen: level name, number of questions, pass mark, topics covered.
2. Question screen: question number ("Serve 3 of 12"), score, prompt, optional scenario text, options, "Submit answer" button.
3. Feedback (same screen, below the options): correct / incorrect, the correct answer, explanation, rule reference(s). Button "Next serve".
4. Result screen: final score, passed / not passed, list of all questions with the player's answer, the correct answer and the rule reference. Buttons: "Retry level", "Next level" (if unlocked), "Back to levels".

The answer is locked after submission. There is no going back to change answers.

### 3.3 Scoring (Showdown-style score)

- Display is a match score: **Player vs. Rulebook**.
- Correct answer: player scores 2 points (announced as "Goal").
- Wrong answer: Rulebook scores 2 points.
- Multiple-choice questions with several correct options: all-or-nothing. No partial credit.
- Final score example: 20 : 4 (10 correct, 2 wrong) = passed.
- Streak: 3 or more correct answers in a row show a streak counter. The streak has no effect on pass/fail.
- Best result per level is stored (score, date).

### 3.4 Timer

- Off by default (WCAG 2.2.1 Timing Adjustable; screen-reader users need more time).
- Optional "Match pace" setting: 45 seconds per question. When time runs out, the answer counts as wrong. Settings allow 45 s, 90 s, or off.
- Timer state is announced at 15 seconds remaining (aria-live polite), matching the referee's "15 seconds" call.

### 3.5 Badges (local only)

- "Trainee Referee", "National Referee", "International Referee" – passing each level.
- "Clean sheet" – a run without a wrong answer.
- "Rulebook" – every question in a level pool answered correctly at least once.

Badges are text plus an icon; the text carries the meaning.

## 4. Question types (v1)

| Type | UI | Scoring |
|---|---|---|
| `single` | radio group in a `fieldset` with `legend` | correct if the chosen option is correct |
| `multiple` | checkbox group, prompt says "Select all that apply" | correct only if the selected set equals the correct set |

Planned for later versions (not v1): `order` (put steps of a procedure in order, keyboard-operable move up/down buttons), and two-step questions (decision, then sanction).

## 5. Accessibility requirements (mandatory)

Target: WCAG 2.2 level AA. Every question must be answerable from its text alone; optional diagrams (see 6.3 `media`) only supplement the text.

- Semantic HTML: one `h1` per screen, headings in order, `main`, `nav`, `fieldset`/`legend` for each question, native `input type="radio|checkbox"` with `label`.
- Full keyboard operation; visible focus indicator (min. 3:1 contrast); no keyboard traps.
- Focus management: after "Submit answer", focus moves to the feedback heading; after "Next serve", focus moves to the new question heading.
- Score and feedback updates use an `aria-live="polite"` region. No `aria-live="assertive"` except time-out of the timer.
- No information carried only by colour, icon, image or sound. Correct/incorrect is stated in text.
- Sounds (whistle on submit, double whistle on correct answer) are optional, off by default, with a toggle in settings, and never the only signal.
- Text contrast min. 4.5:1; supports 200 % zoom and 320 px width reflow without horizontal scrolling.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`; provide a manual high-contrast / dark theme toggle.
- `lang` attribute set from the active locale.
- No CAPTCHAs, no hover-only content, no drag-and-drop-only interactions.
- Test matrix before release: NVDA + Firefox/Chrome (Windows), JAWS + Chrome, VoiceOver + Safari (macOS and iOS), TalkBack + Chrome (Android). Automated checks with axe-core in CI.

## 6. Content and data model

### 6.1 File layout

```
/content
  /packs
    /core-2026/                 # pack id = folder name
      pack.json                 # pack metadata
      questions.en.json         # all questions of the pack, English
      questions.de.json         # (later) same ids, translated text
  /i18n
    ui.en.json                  # all UI strings
/schema
  pack.schema.json
  questions.schema.json
```

### 6.2 Pack metadata (`pack.json`)

```json
{
  "id": "core-2026",
  "title": { "en": "IBSA Showdown Rules 2026–2028" },
  "edition": "2026-2028",
  "levels": ["trainee", "national", "international"],
  "defaultLocale": "en"
}
```

### 6.3 Question object

```json
{
  "id": "T-006",
  "level": "trainee",
  "topics": ["serve", "faults"],
  "importance": "critical",
  "frequency": "common",
  "type": "single",
  "difficulty": 1,
  "edition": "2026-2028",
  "status": "draft",
  "prompt": "Player A serves. The ball passes over the centre screen. What is the decision?",
  "scenario": null,
  "options": [
    { "id": "a", "text": "Re-serve" },
    { "id": "b", "text": "1 point to Player B" }
  ],
  "correct": ["b"],
  "fixedOrder": false,
  "explanation": "A ball that passes over the centre screen is a fault ...",
  "ruleRefs": ["16.4.1"],
  "media": null,
  "requiresVision": false,
  "reviewNote": "Internal note for the reviewer. Never shown in the app."
}
```

Field rules:

- `id`: unique across all packs. Prefix T/N/I per level.
- `level`: `trainee` | `national` | `international`.
- `topics`: array with 1–3 entries, first entry = primary topic. Allowed values: `match-format`, `serve`, `faults`, `goal-area`, `dead-ball`, `time-outs`, `change-sides`, `warnings-penalties`, `equipment`, `procedures`, `signals`, `team-play`.
- `importance`: `critical` (referee must decide during play without consulting the rulebook) | `standard`.
- `frequency`: `common` | `rare` – how often the situation occurs in matches.
- `type`: `single` | `multiple`.
- `difficulty`: 1–3, used for ordering within a run (easier first).
- `status`: `draft` | `reviewed` | `approved`. **The production build includes only `approved` questions.** A preview build (branch deploys) includes all.
- `correct`: array of option ids. `single` requires exactly one.
- `ruleRefs`: rule numbers as printed in the rulebook.
- `media`: `null` in v1. From v1.1 optional: `{ "type": "svg", "src": "media/<file>.svg", "alt": "<short text alternative>", "description": "<long description, optional>" }`. `alt` is required when `media` is set. Diagrams are drawn for this project; IBSA drawings are not copied.
- `requiresVision`: `false` in v1. From v1.1, `true` marks a question that cannot be answered without seeing the diagram. A setting "Screen reader mode" excludes these questions from all runs. The validator rejects `requiresVision: true` without `media`.
- `reviewNote`: stripped from the build output.

Translation: each locale file holds the same ids with translated `prompt`, `scenario`, `options[].text`, `explanation`. Non-text fields (`correct`, `level`, etc.) must match the English file; the validator checks this.

### 6.4 Validation

A script (`npm run validate`) runs in CI and fails the build when:

- a file does not match the JSON schema,
- ids are duplicated,
- a `correct` id does not exist in `options`,
- a `single` question has more or fewer than one correct option,
- `topics` is empty, has duplicates or unknown values, or `importance` / `frequency` has an unknown value,
- a locale file differs from the English file in ids or non-text fields,
- in a **production** build: a level pool has fewer `approved` questions than "questions per run".

Build modes (environment variable `CONTENT_MODE`):

- `preview` (default for local development and Cloudflare Pages branch deploys): includes questions of every `status`, shows the preview banner, and counts all questions for the pool-size check.
- `production` (main branch): includes only `approved` questions. While a level has fewer than 12 approved questions, that level is shown as "Coming soon" and cannot be started; the build does not fail. The production build fails only if **no** level has enough approved questions.

Until Stefan has approved questions, all questions are `draft`. This is expected: develop and test with `CONTENT_MODE=preview`.

## 7. Progress storage

- `localStorage`, key `showdown-quiz:v1`, wrapped in try/catch. The app works without storage (progress then lasts for the session only).
- Stored: unlocked levels, best score per level and per focus, badges, settings (timer, sound, theme, locale), ids of questions answered correctly at least once, ids of questions answered wrong and not yet answered correctly since.
- "Reset progress" button in settings with a confirmation step (in-page dialog, not `window.confirm`).
- No personal data, no cookies, no accounts.

## 8. Technology and hosting

- Static site, built with Vite + TypeScript. Framework optional (Preact or none); keep the bundle small.
- Hosting: **Cloudflare Pages**, production on the main branch, preview deploys per branch (preview builds include draft questions and show a "PREVIEW – draft content" banner).
- Analytics: none in v1, or Cloudflare Web Analytics (cookieless) if requested later.
- Footer: rule edition used, link to the IBSA Showdown rules page, disclaimer "Not an official IBSA publication. The IBSA rulebook is the binding source."

## 9. Screens (v1)

1. **Home** – title, short purpose, "Start" button, levels list with lock state and best score, link to settings and "About".
2. **Level start** – see 3.2.
3. **Question / feedback** – see 3.2.
4. **Result** – see 3.2.
5. **Settings** – timer, sound, theme, language (only English in v1), reset progress.
6. **About** – rule edition, disclaimer, credits, contact / feedback link for rule errors.

## 10. Future packs and variations (design must allow these without code changes)

- `changes-2026`: questions on differences between the 2022–2025 and 2026–2028 rules.
- `changes-2029`: questions on differences in the rule set that follows 2026–2028.
- `team-play`: team match rules (Part C).
- `equipment`: table, bat, mask and hand-protection specifications.
- Additional languages via `questions.<locale>.json` and `ui.<locale>.json`.

The home screen lists available packs when more than one exists.

## 11. Out of scope for v1

Accounts, leaderboards, certificates, diagrams and other media (planned for v1.1), audio/video, question types other than `single` and `multiple`.

## 12. Visual design (design sprint v0.1)

- Reference screens: design canvas "Showdown Rules Quiz – Design Sprint" (https://claude.ai/artifact/AZ1vxHzEYhdX2phDHXN3ik), boards: Identity, Mobile Home, Question, Feedback (incorrect), Result, Settings, Desktop Question with feedback (correct). Stefan can share the canvas or export the boards if access is needed.
- Tokens: `docs/design/tokens.json` (font, sizes, spacing, radii, three themes). Implement them as CSS custom properties; theme switch via `data-theme` on `<html>` (`light`, `dark`, `high-contrast`), default from `prefers-color-scheme` and `prefers-contrast: more`.
- Working name in the UI: **"Call it."** with subtitle "Showdown Rules Quiz" (final name may change; keep it in `ui.en.json`).
- Font: Atkinson Hyperlegible Next (text) and Atkinson Hyperlegible Mono (score). Self-hosted.

Screen patterns:

- **Header (all screens):** dark bar. On question screens it shows "Quit level", "<Level> · Serve n of 12", the score "You x : y Rulebook" (mono numerals), the streak, and a progress bar (`role="progressbar"` with value).
- **Answer options:** full-width labels containing native radio/checkbox inputs, min. 48 px high. Selected option: 3 px ink border and bold text.
- **Feedback state:** the fieldset is disabled. The correct option gets the label "Correct answer" (blue, solid border). A wrong chosen option gets "Your answer · incorrect" (orange, dashed border). The player's correct choice gets "Your answer · correct". Below: feedback panel with heading "Correct. Goal for you." / "Incorrect. Point for the Rulebook.", explanation, rule numbers. Focus moves to that heading.
- **Primary buttons:** "Submit answer", "Next serve" – ink background. Level start / next level – accent background.
- **Result:** "Passed" / "Not passed", final score, "x of 12 correct. Pass mark: 10.", new badge panel, "To review" list (wrong answers with "Your answer", "Correct", rule numbers), "Show all 12 answers", next-level and retry buttons.
- **Home:** level cards with state text "Passed" / "Unlocked" / "Locked", best score, start button on the next open level, link "Practice all unlocked questions", footer disclaimer.
- **Settings:** time per question (Off / 90 s / 45 s), theme (Same as device / Light / Dark / High contrast), whistle sounds checkbox (off), language select, "Reset progress" (with confirmation dialog).
- **Desktop (≥ 900 px):** content max 1080 px; question column plus a side panel with level, progress, score, streak and pass mark. Below 900 px the panel moves above the question as the header.

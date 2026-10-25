# Showdown Rules Quiz – Decisions log

| Date | Topic | Decision |
|---|---|---|
| 2026-10-25 | Question style | Mix of rule-knowledge questions and "what is the correct call?" match scenarios |
| 2026-10-25 | Gamification | Levels, score, streaks, optional timer, result screen. No accounts; progress stored in the browser |
| 2026-10-25 | Accessibility | Core requirement: WCAG 2.2 AA, screen-reader tested, keyboard only, no information by image, colour or sound alone |
| 2026-10-25 | Content | Cowork drafts questions from the IBSA rulebook with rule references; Stefan (referee, former chair of the referee committee) reviews before release |
| 2026-10-25 | Rule edition | IBSA Showdown Rules 2026–2028 (valid 1 Feb 2026 – 31 Dec 2028). Later packs can cover rule changes between editions |
| 2026-10-25 | Languages | English in v1; text stored separately for later translation |
| 2026-10-25 | Progression | Referee levels Trainee → National → International; 12 questions per run, pass mark 10 |
| 2026-10-25 | Bank size | About 60 questions in v1 (20 per level) |
| 2026-10-25 | Hosting | Cloudflare Pages (static site) |
| 2026-10-25 | Hand-off | Design spec (Markdown) + question bank (JSON) in the repository folder `showdown-quiz/` |
| 2026-10-25 | Topic focus | Questions carry `topics` (array), `importance` (critical/standard) and `frequency` (common/rare). Weighted draw and focus training (e.g. warnings & penalties, critical & rare) |
| 2026-10-25 | Audience | Primary audience: referees (fully sighted, rule 7.1). Quiz stays fully usable for blind and visually impaired people |
| 2026-10-25 | Diagrams | v1 text only. v1.1 adds own SVG diagrams (`media`, with text alternative) and `requiresVision` with a screen reader mode. One quiz, no separate versions |
| 2026-10-25 | No-fault scenarios | About 20–30 % of scenarios have "no decision, play continues" (or equivalent) as the correct answer |
| 2026-10-25 | Design sprint | Visual design and screens are drafted on a design canvas before the hand-off to Claude Code. Draft: name "Call it.", font Atkinson Hyperlegible Next, light / dark / high-contrast themes (pending Stefan's choice) |

## Backlog

- Rule-wording pass: go through the rulebook for ambiguous wording and write questions that target the likely misreadings (log: `design/rule-wording-notes.md`).

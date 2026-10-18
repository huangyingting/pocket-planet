# Pocket Planet: documentation

| Area | Document | What it covers |
|---|---|---|
| Research | [Exploration report](research/exploration-report.md) | Reference product (myearthtoy.com): routes, screens, data flows, edge cases, coverage |
| Product | [PRD](product/prd.md) | Goals, users, features F1–F15, non-goals, success metrics |
| Product | [Spec](product/spec.md) | Behaviour and constants per feature, API contract, static pages |
| Product | [Acceptance criteria](product/acceptance-criteria.md) | Given/When/Then, each mapped to an automated test |
| Product | [Feature parity](product/feature-parity.md) | Reference vs Pocket Planet, capability by capability |
| Architecture | [ADRs](architecture/adr.md) | Architecture decision records (ADR-001 to ADR-013) |
| Architecture | [Architecture & data model](architecture/architecture-and-data-model.md) | Modules, storage keys, SQLite schema, data flows, security |
| Planning | [Implementation plan](planning/implementation-plan.md) | Milestones M0–M12 with exit criteria |
| Planning | [Backlog](planning/backlog.md) | Done tasks T-01…T-24 and open items B-01…B-17 with priority and size |

Suggested reading order: exploration report, PRD, ADRs, architecture, spec, then acceptance criteria.

`assets/screenshots/` holds screenshots of Pocket Planet written by the e2e suite (`npm run test:e2e`). Reference-site screenshots live in [`../research/screenshots/`](../research/screenshots/).

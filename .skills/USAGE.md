# Pixframe Skill Map

This is a practical guide for which vendored skill to use for common Pixframe work.

## Fast Picks

- UI polish / layouts / new screens: `frontend-design`, `ui-ux-pro-max`
- Bug triage + fix strategy: `error-debugging-error-analysis`
- Security checks (client-side app): `vibesec`
- Web UI behavior verification: `webapp-testing`
- New frame/theme ideas: `theme-factory`

## By Task

### UI / UX work

Use when: adding panels, sidebars, settings UI, onboarding flows, empty states.

- Primary: `frontend-design`
  - Good for: distinctive layouts, typography, motion, coherent visual direction
- Reference/systematize: `ui-ux-pro-max`
  - Good for: UX heuristics, consistency, accessibility checks, design-system thinking

### Debugging and bug fixing

Use when: something breaks, performance regresses, state/selection issues, render glitches.

- `error-debugging-error-analysis`
  - Suggested loop: reproduce -> narrow scope -> hypothesis -> verify -> add guardrails

### Testing and verification

Use when: you need confidence a UI behavior works (drag-drop, selection, export).

- `webapp-testing`
  - Use for: manual test plans, automation snippets, DOM inspection strategies

### Security and privacy

Use when: validating that local-only photo processing does not leak data; reviewing dependencies.

- `vibesec`
  - Use for: threat modeling, insecure patterns, dependency risk, data handling review

### Theme / frame generation

Use when: creating new theme variants, naming, style consistency, showcases.

- `theme-factory`

## How To Apply In This Repo

- Web app code: `web/src/**`
- Mobile app code: `mobile/src/**`
- Shared patterns: state stores (`*/src/stores/**`), rendering (`*/src/core/**`), themes (`*/src/themes/**`)

## Conventions

- Prefer incremental changes (small diffs) and run `npm run lint` + `npm run build` in both `web/` and `mobile/`.
- When fixing UI state issues, verify:
  - initial state
  - add/remove flows
  - selection boundary conditions (empty, last item removed, index out of range)

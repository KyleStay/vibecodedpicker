# Agent Guidance

Use the Playwright E2E suite as the default verification path for this app.

## Required verification
- After any UI, interaction, URL/state, canvas, CRT, or visual change, run `npm run test:e2e`.
- After intentional visual changes, run `npm run test:e2e:update-snapshots` and inspect the snapshot diff before finalizing.
- For scoped changes, run the affected spec first, then the full suite before finalizing.
- After any user-facing behavior, control, URL/state, visual, or help-text change, update the relevant Playwright tests in the same change.
- After any user-facing behavior, control, shortcut, URL/state, or help-text change, update documentation in the same change. Treat in-app help text as documentation, not just `README.md`.
- For visual effect tuning work, keep default-state snapshots and any high-signal non-default variants aligned with the intended public controls.
- Treat overdrive as the CRT phosphor-response feature. If you change its beam drive, persistence, bloom model, or URL semantics, update docs and visual tests in the same change.
- When changing default control values or visual timing profiles, update the default documentation language and the corresponding snapshot baselines in the same change.
- When changing overdrive rendering internals, keep the deterministic `e2e=1` performance instrumentation and GPU/CPU verification coverage aligned with the renderer path you ship.

## Notes
- This is a static single-file app, but automated verification should be done through Playwright, not ad hoc screenshot scripts.
- The hidden `e2e=1` mode exists only to make tests deterministic. Do not treat it as a public feature.

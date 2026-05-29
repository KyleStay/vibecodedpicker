# Agent Guidance

Hello, agent. This repo is a static, single-file Matrix random picker. You are probably here to change picking behavior, tune the CRT renderer, improve roster workflows, or keep the tests honest.

The app should feel like a useful tool wearing a theatrical interface. Preserve both halves.

## What this is

Vibecoded Picker turns a roster into a shareable selection ritual: operatives, Matrix rain, CRT phosphor, extraction aliases, undo, reset, shortcuts, and URL-persisted controls.

This is not a framework app. The current shape is intentional: one portable `index.html`, one Playwright suite, and enough runtime instrumentation for an agent to inspect the important paths.

## Relevant parties

- *you* - the agent reading this file and working directly in this repo.
- *we*/*us* - the humans maintaining and prompting work on this picker.
- *users* - people using the picker directly, often through a shared URL.
- *operatives* - roster entries that can be picked, renamed, reordered, copied, undone, or reset.

## Principles

### Keep the single-file spell intact

Prefer changes that keep the app portable, inspectable, and deployable as a static page. Do not add a build step, framework, bundler, or server dependency unless we explicitly approve that direction.

### Treat the aesthetic as behavior

Matrix rain, CRT mode, bloom, scanlines, effect reset controls, and the command-panel language are product behavior, not decoration. If a visual change affects how the picker feels, test and document it like a real feature.

### Fight for the obvious control

Controls should do what an agent and a user would naturally assume from their labels, shortcuts, URL params, and visible state. When implementation details get clever, push them behind an obvious interaction.

### Preserve shareable state

URL parameters are a public contract. Shared links should keep their meaning across changes, and old params should be migrated or tolerated when reasonable.

### Let agents inspect the runtime

The hidden `e2e=1` mode exists so tests and agents can verify deterministic renderer behavior. Keep performance instrumentation aligned with the renderer path that actually ships.

## Mental model

The roster is the source of truth. Picking marks an operative selected. Undo restores the previous operative and queues that operative for the next pick. Reset makes all operatives available again.

Extraction mode changes what gets copied, not who the operative is. Aliases are values attached to operatives.

CRT mode is a believable green phosphor display.

Rain controls are grouped by what they affect: motion, perspective, texture, and CRT tube response. Each effects group has its own reset button, and Reset All Effects must leave roster and extraction state alone. Flat Grid Rain is the default; it forces the pre-distortion lanes into a uniform grid and collapses perspective-only controls. Organic perspective rain is the opt-in `rain-layout=organic` state, with legacy `flatGrid=false` links still accepted. Keep both modes aligned with renderer constants, URL state, shortcuts, and tests.

## Required verification

- After any UI, interaction, URL/state, canvas, CRT, or visual change, run `npm run test:e2e`.
- After intentional visual changes, run `npm run test:e2e:update-snapshots` and inspect the snapshot diff before finalizing.
- For scoped changes, run the affected spec first, then the full suite before finalizing.
- After any user-facing behavior, control, URL/state, visual, or help-text change, update the relevant Playwright tests in the same change.
- After any user-facing behavior, control, shortcut, URL/state, or help-text change, update documentation in the same change. Treat in-app help text as documentation, not just `README.md`.
- For visual effect tuning work, keep default-state snapshots and any high-signal non-default variants aligned with the intended public controls.
- When changing default control values or visual timing profiles, update the default documentation language and the corresponding snapshot baselines in the same change.

## Notes

- Automated verification should be done through Playwright, not ad hoc screenshot scripts.
- The hidden `e2e=1` mode exists only to make tests deterministic. Do not treat it as a public feature.

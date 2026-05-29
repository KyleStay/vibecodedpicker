# Vibecoded Picker

Vibecoded Picker is a single-file Matrix-flavored random picker for turning a roster into a theatrical selection ritual.

The goal is not just to pick a name. The goal is to make selection feel alive: operatives, Matrix rain, CRT phosphor, URL-shareable state, extraction aliases, undo, reset, and controls that can survive being passed around as a static page.

Try it here: https://kylestay.github.io/vibecodedpicker/

## Current status

The app is a static `index.html` with Playwright coverage for picking, roster editing, URL persistence, shortcuts, CRT routing, performance instrumentation, and visual snapshots.

Roster entries can be renamed inline by clicking the operative name and reordered from the grip handle. Extraction mode keeps the same rename flow and still allows reordering from the handle while alias inputs remain editable.

## Design intent

This project should stay immediate, inspectable, and portable. It should open as plain `index.html`, deploy cleanly to GitHub Pages, and remain understandable to an agent working without a build system.

The Matrix and CRT layers are not skins on top of the picker. They are part of the experience. Tune them as product behavior: if a change affects the selection ritual, shared URL state, or visual feel, update the tests and docs with it.

## State contract

User-facing controls are persisted in readable URL parameters, including Matrix rain settings such as `rain-layout=organic`, `rain-depth`, `rain-variety`, `lane-drift`, `gap-density`, `leader-heat`, and `glyph-mutation`, plus CRT settings such as `crt-effect=off`, `crt-fishbowl`, `crt-vignette`, `crt-beam-focus`, `crt-scanlines`, `crt-grille`, `crt-noise`, `crt-sync-roll`, `crt-jitter`, and `crt-distortion-drift`. Flat Grid Rain is the default, so new flat-grid links omit `rain-layout`; organic perspective rain is shared as `rain-layout=organic`. In default flat-grid mode, perspective-only rain settings are intentionally omitted from new shared URLs because depth and lane drift are not active, while cascade entropy and rain texture settings still apply to the flat lanes. Older camelCase/shared-link parameters such as `flatGrid=false`, `rainDepth=70`, `extract=true`, and `crt=false` are still accepted.

Roster state is written as repeated `name` and `alias` pairs so shared links can be read and edited directly, for example `name=Neo&alias=The+One&name=Trinity&alias=Hacker`. Older `roster` JSON and `names` links are still tolerated as legacy input.

Shared links should keep their meaning across changes. If you retune defaults, limits, or renderer-specific response curves, update the Playwright suite and documentation in the same change.

## Rendering model

CRT mode is tuned as a believable green phosphor display: tube curvature, edge falloff, beam focus, scanline contrast, aperture grille, signal noise, sync roll, horizontal jitter, and time-varying distortion drift can be shaped without losing the Matrix rain identity. Distortion drift is tastefully enabled by default and can be set to `0%` for a steady signal. Beam focus and chromatic offset shape the phosphor spot, while scanlines and aperture grille clarity stay separate fixed CRT-face effects; signal noise is introduced before the grille and glass vignette shape the final image. Flat Grid Rain is the default pre-distortion rain model: an evenly spaced lane grid that disables perspective controls while keeping cascade entropy, texture, mutation, and CRT effects available.

Rain texture and perspective controls update the active streams in place where the lane geometry allows it. Changing entropy, dropouts, leader burn, drift, or depth should preserve the current falling code instead of clearing the canvas; future glyphs inherit the new profile as they enter the trail.

The hidden `e2e=1` mode exposes deterministic performance metrics so the Playwright suite can validate the active rain and CRT paths.

## Development

Install dependencies and browser tooling:

```bash
npm install
npm run test:e2e:install
```

Run the UI suite:

```bash
npm run test:e2e
```

For intentional visual updates:

```bash
npm run test:e2e:update-snapshots
```

You can still open `index.html` directly for quick manual inspection, but automated verification should be done through the Playwright suite.

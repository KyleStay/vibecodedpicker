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

User-facing controls are persisted in readable URL parameters, including Matrix rain settings such as `rain-layout=organic`, `rain-depth`, `rain-variety`, `lane-drift`, `gap-density`, `leader-heat`, and `glyph-mutation`, fullscreen-backed presentation state such as `matrix-mode=on`, plus CRT settings such as `crt-effect=off`, `crt-fishbowl`, `crt-vignette`, `crt-beam-focus`, `crt-scanlines`, `crt-grille`, `crt-noise`, `crt-sync-roll`, `crt-jitter`, `crt-distortion-drift`, and `crt-startup-time`. Flat Grid Rain is the default, so new flat-grid links omit `rain-layout`; organic perspective rain is shared as `rain-layout=organic`. In default flat-grid mode, perspective-only rain settings are intentionally omitted from new shared URLs because depth and lane drift are not active, while cascade entropy and rain texture settings still apply to the flat lanes. Older camelCase/shared-link parameters such as `flatGrid=false`, `rainDepth=70`, `extract=true`, and `crt=false` are still accepted.

Matrix-mode links request fullscreen when opened; browsers that block fullscreen without a user gesture retry the request on the first click, tap, or non-exit key press.

The command palette includes `Copy Blank Matrix Mode URL` for copying a clean `matrix-mode=on` link without the current roster or tuned settings.

Roster state is written as repeated `name` and `alias` pairs so shared links can be read and edited directly, for example `name=Neo&alias=The+One&name=Trinity&alias=Hacker`. Older `roster` JSON and `names` links are still tolerated as legacy input.

Shared links should keep their meaning across changes. If you retune defaults, limits, or renderer-specific response curves, update the Playwright suite and documentation in the same change.

## Rendering model

CRT mode is tuned as a believable green phosphor display: tube curvature, edge falloff, beam focus, scanline contrast, aperture grille, signal noise, sync roll, horizontal jitter, and time-varying distortion drift can be shaped without losing the Matrix rain identity. Initial CRT loads begin on black glass with a tiny standby light while the app prepares; once the app is ready, the raster wakes from a cold center beam, jitters through unstable sync, then expands into the full phosphor field at the configured startup time. Startup time is tunable from `0.8s` to `9.0s`, with `3.6s` as the default. Distortion drift is tastefully enabled by default and can be set to `0%` for a steady signal. Beam focus and chromatic offset shape the phosphor spot, while scanlines and aperture grille clarity stay separate fixed CRT-face effects; signal noise is introduced before the grille and glass vignette shape the final image. Flat Grid Rain is the default pre-distortion rain model: an evenly spaced lane grid that disables perspective controls while keeping cascade entropy, texture, mutation, and CRT effects available.

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

For faster agent and local loops, run the smallest relevant slice first:

```bash
npm run test:e2e:quick        # shortcuts, picking, roster workflows
npm run test:e2e:state        # URL persistence, settings, reset behavior
npm run test:e2e:crt          # CRT-routed interactions
npm run test:e2e:performance  # renderer instrumentation and animation liveness
npm run test:e2e:visual       # snapshots and CRT rendering model checks
```

You can also target one spec or one title directly:

```bash
npm run test:e2e -- tests/e2e/roster.spec.mjs
npm run test:e2e -- -g "reorders operatives"
```

Use the full suite for broad interaction changes, shared URL contract changes, release confidence, or when a focused run fails in a way that could indicate a wider regression.

For intentional visual updates:

```bash
npm run test:e2e:update-snapshots
```

You can still open `index.html` directly for quick manual inspection, but automated verification should be done through the Playwright suite.

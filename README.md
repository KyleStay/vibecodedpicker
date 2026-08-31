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

User-facing controls persist in readable URL parameters. Matrix rain settings include `rain-layout=organic`, `rain-glyphs=expanded`, `rain-depth`, `rain-variety`, `lane-drift`, `gap-density`, `leader-heat`, and `glyph-mutation`. Fullscreen presentation uses `matrix-mode=on`. CRT settings include `crt-effect=off`, `crt-fishbowl`, `crt-vignette`, `crt-beam-focus`, `crt-scanlines`, `crt-grille`, `crt-noise`, `crt-sync-roll`, `crt-jitter`, `crt-distortion-drift`, `crt-startup-time`, and `crt-adaptive-scale=off`.

Schema titles round-trip literally, including text that resembles a percent escape such as `%20`. Adaptive CRT source scaling is on by default and omitted from new links unless disabled. Flat Grid Rain is the default, so new flat-grid links omit `rain-layout`. Organic perspective rain uses `rain-layout=organic`.

Movie Glyphs is the default and omits `rain-glyphs`. This set contains the 50 symbols from the `ttfx` 0.3.2 Matrix effect used by Omarchy's screensaver. Use `rain-glyphs=expanded` for the expanded feed or `rain-glyphs=original` for the original Matrix alphabet. Older `rain-glyphs=omarchy`, `rain-glyphs=ttfx`, and `rain-glyphs=screensaver` links still select Movie Glyphs. In flat-grid mode, new shared URLs omit perspective-only depth and lane-drift settings. Cascade entropy and rain texture settings still apply to the flat lanes. Older camelCase parameters such as `flatGrid=false`, `rainDepth=70`, `extract=true`, and `crt=false` remain valid.

Matrix-mode links request fullscreen when opened; browsers that block fullscreen without a user gesture retry the request on the first click, tap, or non-exit key press.

The command palette includes `Copy Blank Matrix Mode URL` for copying a clean `matrix-mode=on` link without the current roster or tuned settings.

Roster state is written as repeated `name` and `alias` pairs so shared links can be read and edited directly, for example `name=Neo&alias=The+One&name=Trinity&alias=Hacker`. Duplicate names in shared links are ignored case-insensitively, preserving the first entry and alias so every loaded operative remains independently pickable. Older `roster` JSON and `names` links are still tolerated as legacy input.

Shared links should keep their meaning across changes. If you retune defaults, limits, or renderer-specific response curves, update the Playwright suite and documentation in the same change.

## Rendering model

CRT mode is tuned as a believable green phosphor display: tube curvature, edge falloff, beam focus, scanline contrast, aperture grille, signal noise, sync roll, horizontal jitter, and time-varying distortion drift can be shaped without losing the Matrix rain identity. Initial CRT loads begin on black glass with a tiny standby light while the app prepares; once the app is ready, the raster wakes from a cold center beam, jitters through unstable sync, then expands into the full phosphor field at the configured startup time. Startup time is tunable from `0.8s` to `9.0s`, with `3.6s` as the default. Distortion drift is tastefully enabled by default and can be set to `0%` for a steady signal. Beam focus and chromatic offset shape the phosphor spot, while scanlines and aperture grille clarity stay separate fixed CRT-face effects; signal noise is introduced before the grille and glass vignette shape the final image. Flat Grid Rain is the default pre-distortion rain model: an evenly spaced lane grid that disables perspective controls while keeping cascade entropy, texture, mutation, and CRT effects available.

In CRT mode, the rain source is rendered through a WebGL glyph atlas into the CRT source texture before the tube shader composites it with the UI layer. This avoids the old per-frame Canvas 2D rain upload while preserving the existing 60fps rain loop. Adaptive CRT Scale is enabled by default and lowers only the rain source texture resolution on large viewports; the UI layer remains full resolution, and the setting can be disabled for the fixed `0.7` source scale. The control reports the active scale, source texture size, and viewport tier below the button.

Rain texture and perspective controls update active streams in place where the lane geometry allows it. Changing entropy, dropouts, leader burn, glyph shimmer, drift, depth, or the glyph set does not clear the canvas. Existing trail characters switch to the selected glyph set in place. Future characters use that set as they enter the trail. Glyph mutation shimmer randomly dims some glyphs and gives others an immediate green and alpha pulse. The pulse also affects old tail glyphs and then fades with the normal tail.

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

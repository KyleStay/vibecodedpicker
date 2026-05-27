https://kylestay.github.io/vibecodedpicker/

## Development

This picker is a static single-file app.

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

User-facing controls are persisted in the URL, including overdrive settings such as `overdrive`, `overdriveDrive`, `overdrivePersistence`, `overdriveBloom`, and `glitchOverdrive`. Overdrive now models a green phosphor response rather than a generic glow envelope. CRT mode keeps the fuller phosphor bloom, while non-CRT mode uses a forked, tighter response curve so the same drive, persistence, and bloom settings do not overwhelm the clean rain canvas. The control ranges intentionally allow much more extreme drive, persistence, and bloom than the defaults. If you retune those defaults, limits, or renderer-specific response curves, update the Playwright suite and documentation in the same change.

The highlighted overdrive path now uses a balanced GPU compositor: glyph shapes still rasterize through the CPU canvas text path, while excitation-driven bloom is composited through WebGL in both CRT and non-CRT modes. The hidden `e2e=1` mode exposes deterministic performance metrics so the Playwright suite can validate that the GPU path stays active and measurable.

Roster entries can be renamed inline by clicking the operative name, and reordered from the grip handle. Extraction mode keeps the same rename flow and still allows reordering from the handle while alias inputs remain editable.

You can still open `index.html` directly for quick manual inspection, but automated verification should be done through the Playwright suite.

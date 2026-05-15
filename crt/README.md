# Matrix Picker CRT Variant

This directory is a standalone CRT-enabled version of the Matrix picker. The root `index.html` remains unchanged.

Open `index.html` in this directory, or serve the repository and visit `/crt/`.

The variant includes:

- A WebGL shader pass for the Matrix rain canvas.
- `shaders/crt.vert.glsl` and `shaders/crt.frag.glsl` as standalone shader assets.
- Inline shader fallbacks so the page still works when opened from `file://`.
- A `[T] CRT Engaged` panel toggle with URL persistence.

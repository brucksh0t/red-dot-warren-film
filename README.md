# Red Dot · “The red table on Warren” (film concept)
Unofficial concept preview. Not affiliated with or endorsed by Red Dot Restaurant & Bar, 321 Warren St, Hudson, NY.

A 1999 neighbourhood bar told from directly above its red tabletops. Scroll-scrubbed hero (frites push-in) → the word DOT cut from solid red, scaled into the O → three pinned scroll-scrubbed impact films (Benedict on red, latke Benedict descent, bar truck). One family (Archivo 400/600/900), palette red #d81f27 / ink #151112 / cream #f4ecdc / brass #e3a73f, hard wipes, crisp title bands (no gradients, fades or shadows).

## How the films work (and how to swap in real clips)
- `films/manifest.json` is the only place films are defined. Each film has tiers `d` (landscape) and `m` (portrait); the engine picks whichever displays larger at <= 1.0 device px per image px.
- Today every film is `"type":"frames"`: numbered webp frames cut from Red Dot's real photos by `build-frames.py` (crop window always >= frame size, Lanczos down-scale only; the script asserts this).
- **Swap to real motion later:** set a film to `"type":"video"` and give each tier `{ "src": "films/<id>/<tier>.mp4", "w": <px>, "h": <px> }`. `main.js` seeks the clip by scroll progress and draws it into the same canvas. Rule stays: clip frame size must be the native size (no upscaling; AI video at 720p would only cover <=720px-tall slots at 1.0x).
- Canvas/poster display size is capped at frame px / devicePixelRatio. No-JS/reduced-motion posters use `resolution` media queries (`--r` in styles.css) for the same cap.

## Modes
`?static=1`, `prefers-reduced-motion`, Save-Data/2G, or no JS → static page with posters, all copy and CTAs.

## Rebuild
`python3 build-frames.py && python3 build-stills.py` (Pillow). See CREDITS.md.

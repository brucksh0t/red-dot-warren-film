# Red Dot · “The red table on Warren” (film concept)
Unofficial concept preview. Not affiliated with or endorsed by Red Dot Restaurant & Bar, 321 Warren St, Hudson, NY.

A 1999 neighbourhood bar told from directly above its red tabletops. Scroll-scrubbed hero (frites push-in) → the word DOT cut from solid red, scaled into the O → three pinned scroll-scrubbed AI films (Benedict on red, latke Benedict, the bar). One family (Archivo 400/600/900), sentence-case headings, palette red #d81f27 / ink #151112 / cream #f4ecdc / brass #e3a73f, hard wipes, crisp title bands (no gradients, fades or shadows).

## How the films work
- Each film slot is an **AI image-to-video clip** (GenerateVideo, 720p) generated from Red Dot's own photo, one landscape (`l`) and one portrait (`p`) per film, labelled **AI** on screen. Masters and the upscale manifest are in `/workspace/red-dot-warren-clips/` (box), not in this repo.
- `build-clips.py` encodes all-keyframe H.264 (`-g 1`, 10 fps, CRF 33) so each scroll position is a direct seek, and writes `films/manifest.json`. `main.js` seeks `currentTime` from ScrollTrigger progress (`scrub:true`, no smoothing lag).
- Layout is full-bleed cover (`object-fit:cover`) at every size. **All 8 clips are pending a Topaz upscale**: landscape 3840x2160 (minimum 1920x1080), portrait 1440x2560 (minimum 864x1536). Until then the 720p clips display above 1.0x at 820 / 1440 / 1920.
- Nothing film-related loads before the first interaction (scroll/touch/key); posters are the real photo crop each clip starts from.

## Modes
`?static=1`, `prefers-reduced-motion`, Save-Data/2G, or no JS → static page with posters, all copy and CTAs.

## Rebuild
`python3 build-clips.py && python3 build-stills.py` (Pillow, ffmpeg). See CREDITS.md.

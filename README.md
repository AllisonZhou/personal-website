# Allison Zhou: personal website

A single-file portfolio (`index.html`, no build step and no dependencies beyond Google Fonts).

- A hero name whose letters stretch toward the cursor, over a live field of 0s and 1s
- A 3D carousel of projects (drag, swipe, arrow buttons) that opens each project's Problem / Method / Result write-up
- A scroll-reactive skills marquee, scroll-driven section headings, text scramble on hover and a magnetic button
- A resume section and a contrast toggle (dark navy or light blue)
- Respects `prefers-reduced-motion`

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Enable GitHub Pages for this repository (Settings → Pages → Deploy from a branch → the default branch, root folder). The site will be at `https://allisonzhou.github.io/personal-website/`.

## Edit

All copy (projects, resume, contact) lives in `index.html`. Colors and fonts are CSS variables at the top of the `<style>` block.

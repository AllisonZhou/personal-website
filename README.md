# allison zhou — personal website

A small, dependency-free personal site: a generative flow-field canvas that reacts to your cursor, big editorial type, a custom cursor, and hash routes (`#/hello/`, `#/work/`, `#/about/`, `#/contact/`) with a curtain transition. Each route shifts the colour and mood of the field.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

It's plain static HTML/CSS/JS — enable GitHub Pages on this branch (root folder) and it just works.

## Customize

- Copy lives in `index.html` (name, bio, projects, email, social links).
- Colours and fonts are CSS variables at the top of `styles.css`.
- Field moods per route (`hue`, `speed`, `scale`, `trail`) are in `main.js` → `moods`.
- Rotating hero words: `words` in `main.js`.
- Holding the mouse button down pulls particles toward the cursor instead of pushing them away.
- Respects `prefers-reduced-motion`, and there's a motion toggle in the footer.

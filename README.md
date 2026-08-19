# Daniel & Julia’s Greece Adventure 2026

A public trip site for friends and family — Crete, Santorini, and Athens.

**Live:** https://djboone-travels.netlify.app/

**Repo Netlify should use:** https://github.com/vlaka79/greece-adventure-2026

This folder *is* the site. No Node build.

## Netlify settings

- Repository: `vlaka79/greece-adventure-2026`
- Branch: `main`
- Build command: `python3 decode_media.py` (from `netlify.toml`)
- Publish directory: `.`

A push to `main` republishes automatically.

## Files that must exist

- `index.html`, `site.css`, `app.js`, `favicon.svg`
- `intro.mp4`, `intro.jpg`
- `photos/crete.jpg`, `photos/santorini.jpg`, `photos/athens.jpg`

Media is stored in the repo. `decode_media.py` can rebuild it from `b64/` during the Netlify build if a binary is missing.

Do not add `/* /index.html 200` redirects. That made Netlify serve HTML as the video and photos.

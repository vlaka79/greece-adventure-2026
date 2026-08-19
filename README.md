# Daniel & Julia’s Greece Adventure 2026

A public trip site for friends and family — Crete, Santorini, and Athens.

**Live repo:** https://github.com/vlaka79/greece-adventure-2026

## Publish on Netlify

This folder is already the built site. Netlify runs a tiny script to restore photos and the intro video, then publishes the folder.

1. Open [Netlify](https://app.netlify.com) and sign in (GitHub is fine).
2. **Add new site → Import an existing project**.
3. Choose **GitHub** and authorize Netlify if asked.
4. Select **`vlaka79/greece-adventure-2026`**.
5. Settings:
   - **Build command:** `python3 decode_media.py` (from `netlify.toml`)
   - **Publish directory:** `.` (site root)
6. Deploy. Netlify will give you a `*.netlify.app` URL to share.

Or click:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/vlaka79/greece-adventure-2026)

To update later, push to `main` and Netlify republishes automatically.

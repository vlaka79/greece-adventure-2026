#!/bin/sh
# Restore intro video + destination photos if they are not already in the publish dir.
# Never fail the Netlify build — decode_media.py and _redirects are the fallbacks.
need=0
min_for() {
  case "$1" in
    intro.mp4) echo 100000 ;;
    *) echo 20000 ;;
  esac
}
for f in intro.mp4 intro.jpg photos/crete.jpg photos/santorini.jpg photos/athens.jpg; do
  min=$(min_for "$f")
  if [ ! -s "$f" ]; then
    need=1
    break
  fi
  sz=$(wc -c < "$f")
  if [ "$sz" -lt "$min" ]; then
    need=1
    break
  fi
done
if [ "$need" = 0 ]; then
  echo "media already present"
  ls -l intro.mp4 intro.jpg photos/
  exit 0
fi

echo "downloading media files"
mkdir -p photos
base_jsd="https://cdn.jsdelivr.net/gh/vlaka79/greece-adventure-2026@main"
base_raw="https://raw.githubusercontent.com/vlaka79/greece-adventure-2026/main"
for f in intro.mp4 intro.jpg photos/crete.jpg photos/santorini.jpg photos/athens.jpg; do
  if curl -fL --retry 3 --retry-delay 2 -o "$f" "$base_jsd/$f"; then
    continue
  fi
  curl -fL --retry 3 --retry-delay 2 -o "$f" "$base_raw/$f" || echo "skip $f"
done
ls -l intro.mp4 intro.jpg photos/ || true
exit 0

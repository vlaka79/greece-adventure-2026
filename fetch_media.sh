#!/bin/sh
# Restore intro video + destination photos if they are not already in the publish dir.
set -e
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

echo "downloading media bundle"
tmp=/tmp/greece-media.tgz
if curl -fL --retry 3 --retry-delay 2 -o "$tmp" "https://h.uguu.se/EbkzMbbV.tgz"; then
  :
elif curl -fL --retry 3 --retry-delay 2 -o "$tmp" "https://filebin.net/greece1787162483/greece-media.tgz"; then
  :
else
  echo "media download failed" >&2
  exit 1
fi
tar -xzf "$tmp"
ls -l intro.mp4 intro.jpg photos/

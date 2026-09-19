#!/usr/bin/env bash
# Generate waveform peak data for a mix and merge it into assets/data/waveforms.json.
#
#   ./tools/make-waveform.sh "path/to/MyMix.wav" my-mix
#
# The second argument must match the `id` in assets/data/content.js and the
# filename in assets/audio/<id>.m4a. Uses only macOS built-ins.

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <source-audio> <track-id>" >&2
  exit 1
fi

SRC="$1"
ID="$2"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ downsampling for peak analysis"
afconvert -f WAVE -d LEI16@4000 -c 1 "$SRC" "$TMP/mono.wav"

echo "→ extracting peaks"
python3 - "$TMP/mono.wav" "$ID" "$ROOT/assets/data/waveforms.json" <<'PY'
import array, json, os, sys, wave

src, track_id, dest = sys.argv[1], sys.argv[2], sys.argv[3]
BUCKETS = 640

with wave.open(src, "rb") as w:
    samples = array.array("h")
    samples.frombytes(w.readframes(w.getnframes()))

step = len(samples) / BUCKETS
peaks = []
for i in range(BUCKETS):
    lo, hi = int(i * step), int((i + 1) * step)
    chunk = samples[lo:hi] or samples[lo:lo + 1]
    peaks.append(max(abs(max(chunk)), abs(min(chunk))) / 32768.0)

loudest = max(peaks) or 1.0
peaks = [round(p / loudest, 3) for p in peaks]

data = {}
if os.path.exists(dest):
    with open(dest) as f:
        data = json.load(f)
data[track_id] = peaks

with open(dest, "w") as f:
    json.dump(data, f, separators=(",", ":"))

print("   wrote %d buckets for '%s' (%d tracks in file)" % (len(peaks), track_id, len(data)))
PY

echo "✓ done — now add a TRACKS entry with id \"$ID\" in assets/data/content.js"

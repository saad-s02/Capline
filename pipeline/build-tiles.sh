#!/usr/bin/env bash
# Build the single-file PMTiles archive from the seed GeoJSON, then (optionally)
# upload it to Cloudflare R2. Requires `tippecanoe` and an S3-compatible CLI
# (aws or rclone) configured for R2. See .env.example for the variables used.
#
# Prereqs not present in the CI sandbox: install tippecanoe
#   (https://github.com/felt/tippecanoe) and the aws CLI locally before running.
set -euo pipefail

SEED="${1:-seed.geojson}"
OUT="${2:-capline.pmtiles}"

if ! command -v tippecanoe >/dev/null 2>&1; then
  echo "error: tippecanoe not found. Install it: https://github.com/felt/tippecanoe" >&2
  exit 1
fi
if [ ! -f "$SEED" ]; then
  echo "error: seed file '$SEED' not found. Run the seed pipeline first (pipeline/run-seed.ts)." >&2
  exit 1
fi

tippecanoe -o "$OUT" -l companies \
  --drop-densest-as-needed --extend-zooms-if-still-dropping \
  -Z10 -z18 --force "$SEED"

echo "built $OUT ($(du -h "$OUT" | cut -f1))"

# Optional upload to R2 when R2_ENDPOINT and R2_BUCKET are set.
if [ -n "${R2_ENDPOINT:-}" ] && [ -n "${R2_BUCKET:-}" ]; then
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "$OUT" "s3://${R2_BUCKET}/${OUT}" --endpoint-url "$R2_ENDPOINT"
    echo "uploaded to s3://${R2_BUCKET}/${OUT} via $R2_ENDPOINT"
    echo "verify range requests work (MapLibre needs HTTP 206):"
    echo "  curl -sI -H 'Range: bytes=0-99' \"\$PMTILES_URL\" | grep -i '206\\|content-range'"
  else
    echo "warn: aws CLI not found; skipping upload. Upload $OUT to R2 manually." >&2
  fi
else
  echo "note: R2_ENDPOINT/R2_BUCKET not set; built locally only (no upload)."
fi

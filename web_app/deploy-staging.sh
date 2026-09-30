#!/usr/bin/env bash
# Build the static site and publish it to the staging bucket behind CloudFront.
# Run from anywhere; needs AWS credentials and NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
# (in the environment or web_app/.env.local).
set -euo pipefail

BUCKET="${STAGING_BUCKET:?set STAGING_BUCKET}"
DISTRIBUTION_ID="${STAGING_DISTRIBUTION_ID:?set STAGING_DISTRIBUTION_ID}"

cd "$(dirname "$0")"

npx --yes yarn@1.22.22 install --frozen-lockfile
npx --yes yarn@1.22.22 build

# Hashed build assets never change, so cache them for a year; everything else
# (HTML, markdown, data) is revalidated on every request. cogs/ holds the
# rasters uploaded by data_preparation/make_cogs.py and must survive --delete.
aws s3 sync --only-show-errors out/_next/static "s3://$BUCKET/_next/static" \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync --only-show-errors out/ "s3://$BUCKET/" --delete \
  --exclude "_next/static/*" \
  --exclude "cogs/*" \
  --cache-control "no-cache"

aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" --query "Invalidation.Id" --output text

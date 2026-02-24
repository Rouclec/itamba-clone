#!/bin/sh
set -e
cd "${APP_DIR:-/app}"

export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Replace placeholders in .next/**/*.js with real env vars (e.g. from AWS Secrets)
node scripts/search_and_replace_env.js

# Start the Next.js standalone server
exec node server.js

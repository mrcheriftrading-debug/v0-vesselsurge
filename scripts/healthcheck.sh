#!/bin/bash
# v0-vesselsurge/scripts/healthcheck.sh
# Checks the VesselSurge app plus the live-map data pipeline.

# Set timeout and required headers
TIMEOUT=10
URL="${VESSELSURGE_HEALTH_URL:-https://www.vesselsurge.com/api/health}"

echo "--- Starting VesselSurge Health Check ---"
echo "Targeting: $URL"

# Use curl to check the HTTP status code
BODY=$(curl -s --connect-timeout 5 --max-time "$TIMEOUT" "$URL")
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time "$TIMEOUT" "$URL")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 500 ]; then
    echo "SUCCESS: VesselSurge health endpoint responded with HTTP status code $HTTP_STATUS."
    echo "$BODY"
    HEALTH_STATUS=$(printf "%s" "$BODY" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(j.status||'unknown')}catch{process.stdout.write('invalid-json')}})")
    if [ "$HEALTH_STATUS" = "ok" ]; then
        exit 0
    fi
    if [ "$HEALTH_STATUS" = "degraded" ]; then
        echo "WARNING: VesselSurge health is degraded."
        exit 2
    fi
    echo "FAILURE: VesselSurge health status is $HEALTH_STATUS."
    exit 1
else
    echo "FAILURE: VesselSurge health endpoint responded with HTTP status code $HTTP_STATUS."
    exit 1
fi

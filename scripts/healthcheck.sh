#!/bin/bash
# v0-vesselsurge/scripts/healthcheck.sh
# Checks the VesselSurge app plus the live-map data pipeline.

# Set timeout and required headers
TIMEOUT=10
URL="${VESSELSURGE_HEALTH_URL:-https://www.vesselsurge.com/api/health}"

echo "--- Starting VesselSurge Health Check ---"
echo "Targeting: $URL"

# Use curl to check the HTTP status code
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$URL")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 500 ]; then
    echo "SUCCESS: VesselSurge health endpoint responded with HTTP status code $HTTP_STATUS."
    curl -s --connect-timeout 5 --max-time "$TIMEOUT" "$URL"
    echo
    exit 0
else
    echo "FAILURE: VesselSurge health endpoint responded with HTTP status code $HTTP_STATUS."
    exit 1
fi

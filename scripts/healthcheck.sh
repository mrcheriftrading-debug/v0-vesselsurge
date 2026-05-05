#!/bin/bash
# v0-vesselsurge/scripts/healthcheck.sh
# Runs a simple HTTP GET request to check the status of the live site.

# Set timeout and required headers
TIMEOUT=10
URL="https://vesselsurge.com"

echo "--- Starting VesselSurge Health Check ---"
echo "Targeting: $URL"

# Use curl to check the HTTP status code
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$URL")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    echo "✅ SUCCESS: The site responded with HTTP status code $HTTP_STATUS. The live website is likely operational."
    exit 0
else
    echo "❌ FAILURE: The site responded with HTTP status code $HTTP_STATUS. This indicates a potential issue with the live site."
    exit 1
fi
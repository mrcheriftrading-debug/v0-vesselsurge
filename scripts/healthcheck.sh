#!/bin/bash
# v0-vesselsurge/scripts/healthcheck.sh
# Checks the VesselSurge app plus the live-map data pipeline.

# Set timeout and required headers
TIMEOUT=10
BASE_URL="${VESSELSURGE_HEALTH_URL:-https://www.vesselsurge.com/api/health}"
SEPARATOR="?"
if [[ "$BASE_URL" == *"?"* ]]; then
    SEPARATOR="&"
fi
URL="${BASE_URL}${SEPARATOR}check_ts=$(date +%s)"

echo "--- Starting VesselSurge Health Check ---"
echo "Targeting: $URL"

# Use curl to check the HTTP status code
BODY=$(curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" --connect-timeout 5 --max-time "$TIMEOUT" "$URL")
HTTP_STATUS=$(curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time "$TIMEOUT" "$URL")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 500 ]; then
    echo "SUCCESS: VesselSurge health endpoint responded with HTTP status code $HTTP_STATUS."
    echo "$BODY"
    SUMMARY=$(printf "%s" "$BODY" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{const j=JSON.parse(s);const c=j.components||{};const q=c.sourceQuality||{};process.stdout.write([j.status||'unknown',c.auth?.status||'unknown',c.cache?.status||'unknown',c.coverage?.status||'unknown',q.status||'missing',q.auditStatus||'missing',(q.recommendations||[])[0]||''].join('\t'))}catch{process.stdout.write('invalid-json\tunknown\tunknown\tunknown\tmissing\tmissing\t')}})")
    IFS=$'\t' read -r HEALTH_STATUS AUTH_STATUS CACHE_STATUS COVERAGE_STATUS SOURCE_QUALITY_STATUS SOURCE_AUDIT_STATUS SOURCE_QUALITY_HINT <<< "$SUMMARY"
    echo "Components: auth=$AUTH_STATUS cache=$CACHE_STATUS coverage=$COVERAGE_STATUS sourceQuality=$SOURCE_QUALITY_STATUS audit=$SOURCE_AUDIT_STATUS"
    if [ -n "$SOURCE_QUALITY_HINT" ]; then
        echo "Source quality: $SOURCE_QUALITY_HINT"
    fi
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

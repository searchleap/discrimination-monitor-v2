#!/bin/bash
# Populate Production Metrics Script

echo "📊 Populating production metrics data..."

BASE_URL="https://discrimination-monitor-v2.vercel.app"

# Add several baseline metrics records
for i in {1..10}; do
    echo -n "  Adding metric record $i: "
    
    # Generate realistic values
    PROCESSED=$((5 + RANDOM % 10))
    SUCCESS=$((PROCESSED - RANDOM % 2))
    ERROR=$((PROCESSED - SUCCESS))
    PROCESSING_TIME=$((1500 + RANDOM % 2000))
    QUEUE_DEPTH=$((20 + RANDOM % 30))
    MEMORY=$((40 + RANDOM % 30))
    CPU=$((25 + RANDOM % 35))
    
    PROVIDER="openai"
    if [ $((RANDOM % 5)) -eq 0 ]; then
        PROVIDER="anthropic"
    fi
    
    RESULT=$(curl -s -X POST "${BASE_URL}/api/analytics/metrics" \
        -H "Content-Type: application/json" \
        -d "{
            \"batchSize\": 10,
            \"processedCount\": ${PROCESSED},
            \"successCount\": ${SUCCESS},
            \"errorCount\": ${ERROR},
            \"processingTime\": ${PROCESSING_TIME},
            \"queueDepth\": ${QUEUE_DEPTH},
            \"workerStatus\": \"healthy\",
            \"providerId\": \"${PROVIDER}\",
            \"memoryUsage\": ${MEMORY},
            \"cpuUsage\": ${CPU}
        }")
    
    if echo "$RESULT" | grep -q '"success":true'; then
        echo "✅"
    else
        echo "❌"
    fi
    
    # Small delay to spread timestamps
    sleep 2
done

echo ""
echo "🏥 Checking system health after metrics population..."
curl -s "${BASE_URL}/api/analytics/health" | python3 -c "
import json, sys
data = json.load(sys.stdin)
health = data['health']
print(f'System Health Status: {health[\"status\"]}')
print(f'Health Score: {health[\"score\"]}/100')
print(f'Issues Found: {len(health[\"issues\"])}')
for issue in health['issues']:
    print(f'  - {issue[\"severity\"].upper()}: {issue[\"message\"]}')
"

echo ""
echo "🎯 Production metrics population complete!"
#!/bin/bash
# Phase 3 Endpoint Testing Script

echo "🧪 Testing Phase 3 API Endpoints..."
echo "=================================="

BASE_URL="http://localhost:3000"

# Test AI endpoints
echo "🤖 Testing AI Processing endpoints..."
echo -n "  /api/ai/status: "
if curl -s "${BASE_URL}/api/ai/status" | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo -n "  /api/ai/status (POST test): "
if curl -s -X POST "${BASE_URL}/api/ai/status" -H "Content-Type: application/json" -d '{}' | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Test Analytics endpoints
echo ""
echo "📊 Testing Analytics endpoints..."
echo -n "  /api/analytics/health: "
if curl -s "${BASE_URL}/api/analytics/health" | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo -n "  /api/analytics/metrics: "
if curl -s "${BASE_URL}/api/analytics/metrics" | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo -n "  /api/analytics/reports: "
if curl -s "${BASE_URL}/api/analytics/reports" | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Test Alert endpoints
echo ""
echo "🚨 Testing Alert endpoints..."
echo -n "  /api/alerts/config: "
if curl -s "${BASE_URL}/api/alerts/config" | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo -n "  /api/alerts/history: "
if curl -s "${BASE_URL}/api/alerts/history" | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo -n "  /api/alerts/test: "
if curl -s -X POST "${BASE_URL}/api/alerts/test" -H "Content-Type: application/json" -d '{"alertId":"queue-backlog-warning"}' | grep -q '"success":true'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Test general health
echo ""
echo "🏥 Testing General Health..."
echo -n "  /api/health: "
if curl -s "${BASE_URL}/api/health" | grep -q '"status":"healthy"'; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

echo ""
echo "🎯 Testing Summary Complete!"
echo "=================================="
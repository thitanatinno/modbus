#!/bin/bash

# Test script to demonstrate the difference between batch and individual register reading

echo "🧪 Testing Modbus Register Reading Methods"
echo "=========================================="

SERVER_URL="http://localhost:3000"

echo ""
echo "1️⃣ Testing Individual Register Reading (Fault Tolerant)"
echo "--------------------------------------------------------"
echo "This will read each register separately, so partial failures won't stop other reads."

curl -X POST ${SERVER_URL}/api/mqtt-polling/read-individual \
  -H "Content-Type: application/json" \
  -d '{
    "registers": [300, 301, 302, 311, 312, 313, 316, 317, 406, 604, 605, 606, 610, 611, 612]
  }' | jq '.'

echo ""
echo "2️⃣ Testing Batch Register Reading (Traditional Method)"  
echo "-----------------------------------------------------"
echo "This reads registers 300-612 in one batch. If any register fails, all fail."

curl -X GET ${SERVER_URL}/api/read/input/300/612 | jq '.'

echo ""
echo "3️⃣ Starting Individual Register MQTT Polling"
echo "--------------------------------------------"
echo "This starts continuous individual register polling with MQTT publishing."

curl -X POST ${SERVER_URL}/api/mqtt-polling/start-individual \
  -H "Content-Type: application/json" \
  -d '{
    "registers": [300, 301, 302, 311, 312, 313, 316, 317, 406, 604, 605, 606, 610, 611, 612],
    "interval": 5000,
    "deviceId": "test-device"
  }' | jq '.'

echo ""
echo "4️⃣ Checking MQTT Polling Status"
echo "-------------------------------"

curl -X GET ${SERVER_URL}/api/mqtt-polling/status | jq '.'

echo ""
echo "🎯 Key Benefits of Individual Reading:"
echo "  ✅ Fault tolerant - partial failures don't stop everything"
echo "  ✅ Detailed error reporting per register"  
echo "  ✅ Still publishes successful reads to MQTT"
echo "  ⚠️  Slightly slower than batch reading"
echo ""
echo "🎯 Batch Reading:"
echo "  ✅ Faster when all registers work"
echo "  ❌ Complete failure if any single register fails"
echo "  ❌ No partial data recovery"
echo ""
echo "💡 Recommendation: Use individual reads (AUTO_START_INDIVIDUAL_READS=true)"
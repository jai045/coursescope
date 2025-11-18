#!/bin/bash
# Quick test for audit upload endpoint

echo "Testing audit upload endpoint..."
echo "Starting backend server in background..."

cd "$(dirname "$0")/backend"
source .venv/bin/activate
python api.py > /tmp/coursescope_api.log 2>&1 &
API_PID=$!
echo "Backend PID: $API_PID"

# Wait for server to start
sleep 3

# Test the endpoint
echo ""
echo "Testing upload with your audit PDF..."
curl -X POST http://localhost:5001/api/audit/upload \
  -F "file=@/Users/jaini/Downloads/My Audit - Audit Results Tab 1.pdf" \
  -F "majorId=1" \
  2>/dev/null | python3 -m json.tool | head -50

echo ""
echo ""
echo "Stopping backend server (PID: $API_PID)..."
kill $API_PID 2>/dev/null

echo "Done!"

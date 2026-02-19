#!/bin/bash
# push-state.sh — update Mondrim's avatar state from CLI
# Usage: ./push-state.sh <state> [emotion]
# States: idle | thinking | speaking | listening | success | error
# Example: ./push-state.sh thinking
#          ./push-state.sh speaking neutral
#          ./push-state.sh idle

STATE=${1:-idle}
EMOTION=${2:-neutral}

curl -sk -X POST https://100.83.203.41:8443/state \
     -H "Content-Type: application/json" \
     -d "{\"state\":\"$STATE\",\"emotion\":\"$EMOTION\"}" | python3 -m json.tool

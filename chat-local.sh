#!/bin/bash

echo "🤖 Local Robot Chat (Docker Version)"
echo "===================================="
echo "Available robots:"
echo "  friend - Happy and cheerful"
echo "  nerd   - Smart and technical"  
echo "  zen    - Calm and wise"
echo "  pirate - Silly pirate talk"
echo "  drama  - Dramatic actor"
echo ""

read -p "Choose a robot: " robot
read -p "Your message: " message

echo ""
echo "Sending message to $robot robot..."
echo ""

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"personality\":\"$robot\",\"message\":\"$message\"}" \
  2>/dev/null | python3 -m json.tool

echo ""
echo "Press Enter to chat again, or Ctrl+C to quit"
read
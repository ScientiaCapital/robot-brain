#!/bin/bash

echo "🤖 Robot Chat - Simple Version"
echo "================================"
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

curl -X POST https://robot-brain.tkipper.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"personality\":\"$robot\",\"message\":\"$message\"}"

echo ""
echo ""
echo "Press Enter to chat again, or Ctrl+C to quit"
read
#!/bin/bash

# Docker paths
DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"

echo "🐳 Simple Robot Docker Starter"
echo "=============================="

# Check if Docker is running
if ! $DOCKER info > /dev/null 2>&1; then
    echo "❌ Docker is not running! Please start Docker Desktop first."
    exit 1
fi

# Stop any existing robot container
echo "🛑 Stopping any existing robot container..."
$DOCKER stop simple-robots 2>/dev/null
$DOCKER rm simple-robots 2>/dev/null

# Build the image
echo "🔨 Building robot container..."
$DOCKER build -f Dockerfile.simple -t my-robots .

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the error messages above."
    exit 1
fi

# Run the container
echo "🚀 Starting robot container..."
$DOCKER run -d --name simple-robots -p 8000:8000 my-robots

# Wait a moment for it to start
sleep 2

# Check if it's running
if $DOCKER ps | grep simple-robots > /dev/null; then
    echo "✅ Success! Robots are running!"
    echo ""
    echo "🌐 Your robots are available at: http://localhost:8000"
    echo ""
    echo "📝 Try these commands:"
    echo "   curl http://localhost:8000/"
    echo "   curl http://localhost:8000/robots"
    echo "   ./chat-local.sh"
    echo ""
    echo "🛑 To stop: $DOCKER stop simple-robots"
    echo "📊 To see logs: $DOCKER logs simple-robots"
else
    echo "❌ Container failed to start. Check logs with:"
    echo "   $DOCKER logs simple-robots"
fi
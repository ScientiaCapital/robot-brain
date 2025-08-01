#!/bin/bash

# Script to rebuild Docker container for Robot Brain agents sandbox
# Run this script from the project root directory

echo "🤖 Robot Brain Docker Rebuild Script"
echo "===================================="

# Stop and remove existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old images
echo "🗑️  Removing old images..."
docker image prune -f

# Rebuild the containers
echo "🔨 Building new containers..."
docker-compose build --no-cache

# Start the services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check status
echo "✅ Checking container status..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "🎉 Docker rebuild complete!"
echo ""
echo "Services available at:"
echo "  - Robot API: http://localhost:8000"
echo "  - Ollama: http://localhost:11434"
echo "  - Redis: http://localhost:6379"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
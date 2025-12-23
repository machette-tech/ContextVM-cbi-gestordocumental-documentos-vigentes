#!/bin/bash

# Deploy script for CBI Gestor Documental Documentos Vigentes
# Usage: ./deploy.sh [dev|qa|prod]

set -e

ENVIRONMENT=${1:-dev}
PROJECT_NAME="contextvm-cbi-gestordocumental-documentos-vigentes"

echo "🚀 Deploying $PROJECT_NAME to $ENVIRONMENT environment..."

# Load environment-specific variables
if [ -f ".env.$ENVIRONMENT" ]; then
    source ".env.$ENVIRONMENT"
    echo "✅ Loaded .env.$ENVIRONMENT"
else
    echo "⚠️  No .env.$ENVIRONMENT found, using .env"
    source .env
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build Docker images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.yml build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start new containers
echo "▶️  Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."

# Check app
if curl -f http://localhost:3004/health > /dev/null 2>&1; then
    echo "✅ App is healthy"
else
    echo "❌ App is not responding"
    docker-compose logs app
    exit 1
fi

# Check database
if docker-compose exec -T postgres pg_isready -U contextvm > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is not responding"
    docker-compose logs postgres
    exit 1
fi

# Check relay
if curl -f http://localhost:8085 > /dev/null 2>&1; then
    echo "✅ Relay is healthy"
else
    echo "⚠️  Relay might not be ready yet"
fi

echo ""
echo "✨ Deployment completed successfully!"
echo ""
echo "📊 Service URLs:"
echo "  - App:          http://localhost:3004"
echo "  - Health:       http://localhost:3004/health"
echo "  - Metrics:      http://localhost:3004/metrics"
echo "  - Relay:        ws://localhost:8085"
echo "  - XState:       http://localhost:4005"
echo "  - FSM Designer: http://localhost:4105"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "📊 View metrics: curl http://localhost:3004/metrics"
echo ""

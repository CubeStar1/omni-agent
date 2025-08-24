#!/bin/bash

# Build and run HackRX Backend Docker container

echo "Building HackRX Backend Docker image..."
docker build -t hackrx-backend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    
    echo "🚀 Starting HackRX Backend container..."
    docker run -d \
        --name hackrx-api \
        -p 8000:8000 \
        -v $(pwd)/results:/app/results \
        -v $(pwd)/vector_store_cache:/app/vector_store_cache \
        hackrx-backend:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo "🌐 API is available at: http://localhost:8000"
        echo "📊 Health check: http://localhost:8000/health"
        echo ""
        echo "To view logs: docker logs hackrx-api"
        echo "To stop: docker stop hackrx-api"
        echo "To remove: docker rm hackrx-api"
    else
        echo "❌ Failed to start container"
        exit 1
    fi
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

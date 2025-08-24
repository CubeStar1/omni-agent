# Build and run HackRX Backend Docker container

Write-Host "Building HackRX Backend Docker image..." -ForegroundColor Yellow
docker build -t hackrx-backend:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
    
    Write-Host "🚀 Starting HackRX Backend container..." -ForegroundColor Yellow
    docker run -d `
        --name hackrx-api `
        -p 8000:8000 `
        -v "${PWD}/results:/app/results" `
        -v "${PWD}/vector_store_cache:/app/vector_store_cache" `
        hackrx-backend:latest
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Container started successfully!" -ForegroundColor Green
        Write-Host "🌐 API is available at: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "📊 Health check: http://localhost:8000/health" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To view logs: docker logs hackrx-api" -ForegroundColor Gray
        Write-Host "To stop: docker stop hackrx-api" -ForegroundColor Gray
        Write-Host "To remove: docker rm hackrx-api" -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to start container" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

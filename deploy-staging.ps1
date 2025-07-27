# Deploy to Firebase Hosting - Staging
Write-Host "Building Flutter Web for Staging..." -ForegroundColor Yellow

# Build for staging with environment variables
flutter build web --release --dart-define=ENVIRONMENT=staging --dart-define=USE_MOCK_SERVICES=false

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Deploying to Firebase Staging..." -ForegroundColor Green
    
    # Deploy to Firebase Hosting with staging target (if configured)
    firebase deploy --only hosting:staging
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Staging deployment successful!" -ForegroundColor Green
        Write-Host "Your staging app is now live!" -ForegroundColor Cyan
    } else {
        Write-Host "Staging deployment failed! Trying default hosting..." -ForegroundColor Yellow
        firebase deploy --only hosting
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

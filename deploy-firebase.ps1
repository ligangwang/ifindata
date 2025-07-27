# Deploy to Firebase Hosting - Production
Write-Host "Building Flutter Web for Production..." -ForegroundColor Green

# Build for production with environment variables
flutter build web --release --dart-define=ENVIRONMENT=production --dart-define=USE_MOCK_SERVICES=false

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Deploying to Firebase..." -ForegroundColor Green
    
    # Deploy to Firebase Hosting
    firebase deploy --only hosting
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment successful!" -ForegroundColor Green
        Write-Host "Your app is now live on Firebase Hosting!" -ForegroundColor Cyan
    } else {
        Write-Host "Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}

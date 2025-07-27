# Production Build
Write-Host "🏗️ Building Flutter app for Production..." -ForegroundColor Green
flutter build web --dart-define=ENVIRONMENT=production --dart-define=USE_MOCK_SERVICES=false

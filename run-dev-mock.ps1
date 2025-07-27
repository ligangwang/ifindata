# Development with Mock Services
Write-Host "🚀 Starting Flutter app in Development mode with Mock Services..." -ForegroundColor Green
flutter run -d web-server --web-port 8080 --dart-define=ENVIRONMENT=development --dart-define=USE_MOCK_SERVICES=true

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputFile = "api-test-results_$timestamp.txt"

Write-Host "Running API key test..." -ForegroundColor Green
npm run test:api-key | Tee-Object -FilePath $outputFile

Write-Host "`nResults saved to: $outputFile" -ForegroundColor Cyan
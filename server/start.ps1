Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Starting IRCTC Next-Gen Production REST API Suite" -ForegroundColor Yellow
Write-Host "Port: 8086" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot
node index.js

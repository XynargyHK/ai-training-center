# Revive Staff - 24/7 Monitoring for Windows
$ErrorActionPreference = "SilentlyContinue"
$nodePath = "C:\Users\Denny\ai-training-center\infra\openclaw\core"

Write-Host "--- 🛡️ AI Staff Node Monitor Starting ---" -ForegroundColor Cyan

while($true) {
    Set-Location $nodePath
    
    # Check if Docker is running the Staff Node
    $dockerStatus = docker ps --format "{{.Names}}"
    
    if ($dockerStatus -notmatch "openclaw-local-node") {
        Write-Host "$(Get-Date): ⚠️ Staff is down! Reviving..." -ForegroundColor Yellow
        docker-compose up -d
    } else {
        Write-Host "$(Get-Date): ✅ Staff Node is healthy." -ForegroundColor Green
    }
    
    Start-Sleep -Seconds 60
}

# Revive Staff - 24/7 Monitoring Script for Windows
# Runs in a separate PowerShell window

$ErrorActionPreference = "SilentlyContinue"
$nodePath = "C:\Users\Denny\ai-training-center\infra\local-node"

Write-Host "--- 🛡️ AI Staff Node Monitor Starting ---" -ForegroundColor Cyan

while($true) {
    Set-Location $nodePath
    
    # Check if Docker is running
    $dockerStatus = docker ps --format "{{.Names}}"
    
    if ($dockerStatus -notmatch "staff-agent-local") {
        Write-Host "$(Get-Date): ⚠️ Agent is down! Reviving..." -ForegroundColor Yellow
        docker-compose up -d
    }
    
    if ($dockerStatus -notmatch "staff-browser") {
        Write-Host "$(Get-Date): ⚠️ Browser engine is down! Reviving..." -ForegroundColor Yellow
        docker-compose restart browser
    }

    # Optional: Log memory usage and prune if needed
    Write-Host "$(Get-Date): ✅ Staff Node is healthy." -ForegroundColor Green
    
    Start-Sleep -Seconds 60
}

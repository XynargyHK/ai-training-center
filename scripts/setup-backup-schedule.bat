@echo off
echo Setting up automated database backup schedule...

schtasks /create /tn "AI Training Center Backup 10AM" /tr "C:\Users\Denny\ai-training-center\scripts\run-backup.bat" /sc daily /st 10:00 /rl HIGHEST /f
schtasks /create /tn "AI Training Center Backup 10PM" /tr "C:\Users\Denny\ai-training-center\scripts\run-backup.bat" /sc daily /st 22:00 /rl HIGHEST /f

echo.
echo Done! Backups scheduled for 10:00 AM and 10:00 PM daily.
echo Backup files will be saved to:
echo   C:\Users\Denny\.claude\projects\C--Users-Denny-ai-training-center\backups\
echo.
pause

@echo off
echo Checking backup schedules...
echo.
schtasks /query /tn "AI Training Center Backup 10AM"
echo.
schtasks /query /tn "AI Training Center Backup 10PM"
echo.
pause

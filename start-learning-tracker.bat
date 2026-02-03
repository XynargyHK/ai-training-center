@echo off
REM Start Claude Learning Tracker as background task
echo Starting Claude Learning Tracker...
cd /d "%~dp0"
start /B npm run learning-watch > learning-tracker.log 2>&1
echo Learning Tracker started in background
echo Logs are being written to learning-tracker.log
echo.
echo To view the report, run: npm run learning-report
echo To query facts, run: npm run learning-query "keyword"
pause

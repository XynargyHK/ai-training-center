@echo off
cd /d "C:\Users\Denny\ai-training-center"
node scripts\backup-database.js >> "C:\Users\Denny\.claude\projects\C--Users-Denny-ai-training-center\backups\backup-log.txt" 2>&1

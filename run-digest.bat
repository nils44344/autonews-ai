@echo off
cd /d "C:\Users\NIR\autonews-ai"
echo [%date% %time%] digest start >> digest.log
"C:\Program Files\nodejs\npm.cmd" run digest >> digest.log 2>&1
echo [%date% %time%] digest end (exit %errorlevel%) >> digest.log

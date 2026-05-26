@echo off
cd /d "C:\Users\NIR\autonews-ai"
echo [%date% %time%] cycle start >> cycle.log
"C:\Program Files\nodejs\npm.cmd" run trends:once >> cycle.log 2>&1
echo [%date% %time%] cycle end (exit %errorlevel%) >> cycle.log

@echo off
cd /d "C:\Users\NIR\autonews-ai"
:loop
echo [%date% %time%] starting AutoNews worker >> worker.log
"C:\Program Files\nodejs\npm.cmd" run worker:prod >> worker.log 2>&1
echo [%date% %time%] worker exited (code %errorlevel%), restarting in 15s >> worker.log
timeout /t 15 /nobreak >nul
goto loop

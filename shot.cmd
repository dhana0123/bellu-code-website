@echo off
cd /d C:\Users\Sagar\Music\bellu-code-landing
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
%EDGE% --headless=new --disable-gpu --hide-scrollbars --user-data-dir=%CD%\shots\profile --virtual-time-budget=5000 --window-size=1280,1200 --screenshot=%CD%\shots\desk2.png http://localhost:4188/
echo SHOTS-COMPLETE-2

@echo off
cd /d C:\Users\Sagar\Music\bellu-code-landing
if not exist shots mkdir shots
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
%EDGE% --headless=new --disable-gpu --hide-scrollbars --user-data-dir=%CD%\shots\profile --virtual-time-budget=5000 --window-size=1280,1250 --screenshot=%CD%\shots\desk.png http://localhost:4191/
%EDGE% --headless=new --disable-gpu --hide-scrollbars --user-data-dir=%CD%\shots\profile --virtual-time-budget=5000 --window-size=520,1100 --screenshot=%CD%\shots\mob.png http://localhost:4191/
echo SHOTS-COMPLETE

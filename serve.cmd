@echo off
cd /d C:\Users\Sagar\Music\bellu-code-landing
call npm run build
call npx vite preview --port 4191 --strictPort

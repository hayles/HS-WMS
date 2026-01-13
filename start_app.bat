@echo off
echo Starting Inventory System...

:: 1. Start Backend in a new window
start "Inventory Backend" cmd /k "cd inventory-system\backend && python main.py"

:: 2. Start Frontend in a new window
start "Inventory Frontend" cmd /k "cd inventory-system\frontend && npm run dev"

:: 3. Wait a few seconds for servers to spin up
timeout /t 5 /nobreak >nul

:: 4. Open Browser
start http://localhost:5173

echo.
echo ========================================================
echo   System Started! 
echo   - Backend: http://localhost:8000
echo   - Frontend: http://localhost:5173
echo ========================================================
echo.
pause

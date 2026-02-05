@echo off
echo ========================================
echo Starting Virtual Companion AI
echo ========================================
echo.

REM Check if node_modules exist
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install root dependencies!
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    if errorlevel 1 (
        echo Failed to install backend dependencies!
        pause
        exit /b 1
    )
)

if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    if errorlevel 1 (
        echo Failed to install frontend dependencies!
        pause
        exit /b 1
    )
)

echo.
echo All dependencies installed. Starting servers...
echo.
echo Frontend: http://localhost:3006
echo Backend API: http://localhost:4000
echo Avatar Service: http://localhost:8000
echo.
echo Press Ctrl+C to stop all servers
echo ========================================
echo.

REM Start all services using npm run dev (which uses concurrently)
call npm run dev

pause

@echo off
echo ========================================
echo Checking if everything is ready...
echo ========================================
echo.

set READY=1

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js not found! Install Node.js first.
    set READY=0
) else (
    echo [OK] Node.js found
    node -v
)

REM Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [X] npm not found!
    set READY=0
) else (
    echo [OK] npm found
    npm -v
)

REM Check Python
where python >nul 2>&1
if errorlevel 1 (
    echo [X] Python not found! Install Python 3.10+ first.
    set READY=0
) else (
    echo [OK] Python found
    python --version
)

echo.
echo ========================================
echo Checking dependencies...
echo ========================================
echo.

if not exist "node_modules\" (
    echo [X] Root dependencies missing - run: npm install
    set READY=0
) else (
    echo [OK] Root dependencies installed
)

if not exist "backend\node_modules\" (
    echo [X] Backend dependencies missing - run: cd backend ^&^& npm install
    set READY=0
) else (
    echo [OK] Backend dependencies installed
)

if not exist "frontend\node_modules\" (
    echo [X] Frontend dependencies missing - run: cd frontend ^&^& npm install
    set READY=0
) else (
    echo [OK] Frontend dependencies installed
)

echo.
echo ========================================
if %READY%==1 (
    echo [SUCCESS] Everything is ready!
    echo You can now run: npm run dev
    echo OR: start-dev.bat
) else (
    echo [WARNING] Some dependencies are missing.
    echo Run the setup commands shown above.
)
echo ========================================
echo.

pause

@echo off
title Compare Tool Deployer
echo ===================================================
echo 🚀 Starting Deployment of Compare Tool...
echo ===================================================
echo.

:: 1. Stage all files
git add .

:: 2. Ask user for a commit message
set "msg="
set /p msg="Enter commit message (Press Enter for default: 'Update Compare Tool'): "

:: If user just pressed Enter, set the default message
if "%msg%"=="" set msg=Update Compare Tool

echo.
:: 3. Commit changes
git commit -m "%msg%"

echo.
echo 📦 Pushing changes to GitHub...
:: 4. Push to origin main
git push

echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo 🎉 Successfully pushed to GitHub!
    echo 🌐 GitHub Pages will update your live link shortly.
    echo ===================================================
) else (
    echo ===================================================
    echo ❌ Error: Failed to push to GitHub. 
    echo Please check your internet connection or credentials.
    echo ===================================================
)

echo.
pause

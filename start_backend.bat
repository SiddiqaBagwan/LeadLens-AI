@echo off
echo ====================================
echo  LeadLens — Backend Startup Script
echo ====================================
echo.

:: Navigate to project root (where backend/ folder lives)
cd /d "%~dp0"

:: Activate the virtual environment
call backend\venv\Scripts\activate.bat

echo Starting FastAPI server on http://localhost:8000
echo Press Ctrl+C to stop.
echo.

:: Run uvicorn from project root so 'backend' is found as a package
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

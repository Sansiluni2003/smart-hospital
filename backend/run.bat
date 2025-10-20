@echo off
echo ====================================
echo Smart Hospital Backend
echo ====================================
echo.

REM Activate virtual environment
call venv\Scripts\activate

REM Check if MySQL is required
echo [INFO] Make sure MySQL is running and database 'smart_hospital' exists
echo [INFO] Update .env file with your MySQL credentials
echo.

REM Start the Flask app
echo [INFO] Starting Flask application...
python app.py

pause
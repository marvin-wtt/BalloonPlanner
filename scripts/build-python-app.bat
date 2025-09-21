@echo off

REM Change to the directory of this script, then into src-python
cd /d %~dp0..\src-python

REM Activate the virtual environment
call .venv\Scripts\activate

REM Build the Python application
call pyinstaller ^
      --onefile ^
      --distpath ../dist/python ^
      --workpath ../dist/python/pyinstaller ^
      --specpath ../dist/python/pyinstaller ^
      ./solver_main.py

REM Go to root directory
cd /d %~dp0..\

REM Build electron app
call npm run build


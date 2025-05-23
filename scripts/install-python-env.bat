@echo off

REM Change to the directory of this script, then into src-python
cd /d %~dp0..\src-python

REM Create the virtual environment
python -m venv .venv

REM Activate the virtual environment
call .venv\Scripts\activate

REM Upgrade pip and install requirements
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo [✓] Python virtual environment created and requirements installed.

#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status\set -e

# Change to the directory containing this script, then into src-python
dir=$(dirname "$0")
cd "$dir/src-python"

# Create the virtual environment
tty -s && py_exec=python3 || py_exec=python
$py_exec -m venv .env

# Activate the virtual environment
# shellcheck source=/dev/null
source .venv/bin/activate

# Upgrade pip and install requirements
pip install --upgrade pip
pip install -r requirements.txt

echo "[✓] Python virtual environment created and requirements installed."

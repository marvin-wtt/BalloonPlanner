#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status\set -e

# Change to the directory containing this script, then into src-python
dir=$(dirname "$0")
cd "$dir/src-python"

# Activate the virtual environment
# shellcheck source=/dev/null
source .venv/bin/activate

# Build the Python application
pyinstaller \
      --onefile \
      --distpath ../dist/python \
      --workpath ../dist/python/pyinstaller \
      --specpath ../dist/python/pyinstaller \
      ./solver_main.py

cd ../
npm run build

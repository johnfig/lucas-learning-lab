#!/bin/bash

# Optional cleanup flag
if [ "$1" == "--clean" ]; then
    echo "Cleaning up existing virtual environment..."
    rm -rf .venv
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Make instance directory if it doesn't exist
mkdir -p instance

echo "Setup complete! Your environment is ready." 
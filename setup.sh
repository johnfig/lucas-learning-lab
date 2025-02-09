#!/bin/bash

# Remove old venv if it exists
rm -rf venv

# Create and activate virtual environment with Python 3.11
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install PyTorch for M2 Mac (Apple Silicon)
pip3 install torch torchvision torchaudio

# Install basic requirements
pip install flask==3.0.2 flask-sqlalchemy==3.1.1 
pip install fastapi uvicorn python-multipart
pip install numpy gTTS==2.5.1
pip install pyttsx3 vosk sounddevice

# Install transformer-related packages
pip install transformers sentencepiece accelerate safetensors

# Initialize the database
python3 database.py

# Download models
python3 download_models.py

echo "Setup complete! Your environment is ready." 
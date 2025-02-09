import os
import requests
from pathlib import Path

def download_file(url, destination):
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    with open(destination, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

def setup_models():
    # Define your model files and their URLs
    models = {
        'models/phi-1_5/model.safetensors': 'YOUR_HOSTING_URL/phi-1_5/model.safetensors',
        'models/vosk-model-small-en-us-0.15/model.bin': 'YOUR_HOSTING_URL/vosk-model/model.bin',
        # Add other model files here
    }
    
    for path, url in models.items():
        if not os.path.exists(path):
            print(f"Downloading {path}...")
            download_file(url, path)
            print(f"Downloaded {path}")
        else:
            print(f"{path} already exists")

if __name__ == "__main__":
    setup_models() 
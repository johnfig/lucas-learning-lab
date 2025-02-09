from transformers import AutoModelForCausalLM, AutoTokenizer
import os
from pathlib import Path

def download_model():
    # Using a smaller model that's more suitable for offline use
    model_name = "microsoft/phi-1_5"  # Smaller than phi-2 but still good for our use case
    
    # Create models directory
    models_dir = Path(__file__).resolve().parent.parent.parent / "models"
    model_path = models_dir / "phi-1_5"
    models_dir.mkdir(exist_ok=True)
    
    print(f"Downloading model to {model_path}...")
    
    # Download tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        trust_remote_code=True
    )
    tokenizer.save_pretrained(model_path)
    
    # Download model
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        trust_remote_code=True,
        low_cpu_mem_usage=True
    )
    model.save_pretrained(model_path)
    
    print("Model downloaded successfully!")

if __name__ == "__main__":
    download_model() 
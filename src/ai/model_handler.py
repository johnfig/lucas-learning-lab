from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIModel:
    def __init__(self):
        # Use a smaller model that's good at factual responses
        self.model_name = "facebook/opt-350m"  # Larger model for better quality
        if not Path("models/opt").exists():
            logger.info("Downloading model... This may take a few minutes.")
            self.download_model()
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        self.load_model()
        
        # Pre-defined fun facts for each category
        self.fun_facts = {
            "planets": [
                "Did you know that Jupiter is so big that 1,300 Earths could fit inside it!",
                "Mars has a mountain three times taller than Mount Everest!",
                "Saturn is so light it could float in a bathtub if there was one big enough!",
                "One day on Venus is longer than its entire year!",
                "It rains diamonds on Neptune!"
            ],
            "animals": [
                "Octopuses have three hearts and blue blood!",
                "Sloths are so slow that algae grows on their fur!",
                "Penguins give each other pebbles as presents!",
                "A giraffe's tongue is so long it can clean its own ears!",
                "Dolphins give each other names and call to each other!"
            ],
            "science": [
                "Lightning is five times hotter than the surface of the sun!",
                "Honey never spoils - scientists found 3000-year-old honey in Egypt that's still good!",
                "Your brain generates enough electricity to power a small light bulb!",
                "A day on Earth is getting longer by 1.8 milliseconds every century!",
                "Bananas glow blue under black lights!"
            ],
            "math": [
                "If you multiply any number by 9, the digits in the answer will add up to 9!",
                "The symbol for division (÷) was chosen because it looks like a fraction with dots!",
                "Zero wasn't discovered until around 600 AD!",
                "If you counted to a million, it would take you 23 days!",
                "The word 'hundred' comes from an old Viking word meaning 120, not 100!"
            ],
            "dinosaurs": [
                "T-Rex teeth were as long as bananas!",
                "Some dinosaurs were smaller than chickens!",
                "Velociraptors were actually the size of turkeys!",
                "Scientists think many dinosaurs had colorful feathers like parrots!",
                "The Argentinosaurus was as long as three school buses!"
            ],
            "countries": [
                "In Japan, there's an island where rabbits run free!",
                "In Norway, the sun doesn't set for 60 days during summer!",
                "Australia has a pink lake called Lake Hillier!",
                "In Sweden, there's a hotel made entirely of ice that's rebuilt every winter!",
                "The Netherlands gives tulips to Canada every year as a thank you gift!"
            ]
        }
    
    def download_model(self):
        try:
            model_path = Path("models/opt")
            model_path.mkdir(parents=True, exist_ok=True)
            
            logger.info("Downloading tokenizer...")
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            
            logger.info("Downloading model...")
            model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float32
            )
            
            logger.info("Saving model locally...")
            tokenizer.save_pretrained(str(model_path))
            model.save_pretrained(str(model_path))
        except Exception as e:
            logger.error(f"Error downloading model: {str(e)}")
            raise
    
    def load_model(self):
        try:
            logger.info("Loading model...")
            model_path = str(Path("models/opt"))
            
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                local_files_only=True,
                torch_dtype=torch.float32
            ).to(self.device)
            
            logger.info("Model loaded successfully!")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def generate_response(self, prompt: str) -> str:
        try:
            # Map button text to categories
            category_map = {
                "planets": "planets",
                "countries": "countries",
                "animals": "animals",
                "science": "science",
                "math": "math",
                "dinosaurs": "dinosaurs",
                "inventions": "inventions",
                "body": "body",
                "weather": "weather",
                "ocean": "ocean",
                "insects": "insects",
                "space": "space",
                "ancient": "ancient",
                "volcanoes": "earth",
                "robots": "robots",
                "languages": "languages"
            }

            # Pre-defined fun facts for each category
            fun_facts = {
                "planets": [
                    "Did you know that Jupiter has 79 moons? That's like having 79 little worlds orbiting one planet!",
                    "Mars has a mountain three times taller than Mount Everest!",
                    "Saturn is so light it could float in a bathtub if there was one big enough!",
                    "Venus spins backwards compared to all other planets!"
                ],
                "countries": [
                    "In Japan, there's an island full of friendly rabbits that hop around freely!",
                    "In Norway, the sun doesn't set for 60 days during summer!",
                    "Australia has a pink lake called Lake Hillier that looks like strawberry milkshake!"
                ],
                "animals": [
                    "Octopuses have three hearts and blue blood!",
                    "Sloths are so slow that algae grows on their fur!",
                    "Dolphins give each other names and call to each other using special whistles!"
                ],
                "science": [
                    "Lightning is five times hotter than the surface of the sun!",
                    "Honey never spoils - scientists found 3000-year-old honey in Egypt that's still good!",
                    "Your brain generates enough electricity to power a small light bulb!"
                ],
                "math": [
                    "If you multiply any number by 9, the digits in the answer will add up to 9!",
                    "Zero wasn't discovered until around 600 AD!",
                    "If you counted to a million, it would take you 23 days!"
                ],
                "dinosaurs": [
                    "T-Rex teeth were as long as bananas!",
                    "Some dinosaurs were smaller than chickens!",
                    "Scientists think many dinosaurs had colorful feathers like parrots!"
                ],
                "inventions": [
                    "The first computer was so big it took up an entire room!",
                    "The first person to invent the light bulb wasn't Thomas Edison - there were 22 other inventors before him!",
                    "LEGO was originally a wooden toy company before making plastic bricks!"
                ],
                "body": [
                    "Your body has enough iron in it to make a nail 3 inches long!",
                    "Your heart beats about 100,000 times every day!",
                    "Your fingernails grow faster on your dominant hand!"
                ],
                "weather": [
                    "The fastest wind ever recorded was 253 miles per hour!",
                    "Lightning strikes Earth about 100 times every second!",
                    "Some snowflakes can be as big as a frisbee!"
                ],
                "ocean": [
                    "The blue whale's tongue weighs as much as an elephant!",
                    "There are glowing creatures at the bottom of the ocean that make their own light!",
                    "Giant squids have eyes as big as dinner plates!"
                ],
                "insects": [
                    "Bees can recognize human faces!",
                    "Ants never sleep and they can lift 50 times their body weight!",
                    "Some butterflies can taste with their feet!"
                ],
                "space": [
                    "There's a planet made mostly of diamonds!",
                    "One day on Venus is longer than its entire year!",
                    "There's a giant cloud of raspberry-flavored space dust floating in our galaxy!"
                ],
                "ancient": [
                    "The ancient Egyptians invented toothpaste!",
                    "Kids in ancient Greece played with yo-yos!",
                    "The Great Wall of China was built using sticky rice as mortar!"
                ],
                "earth": [
                    "There are about 1,500 active volcanoes on Earth!",
                    "Earthquakes can make the Earth ring like a bell for days!",
                    "Some volcanoes erupt with blue lava!"
                ],
                "robots": [
                    "There's a robot that can solve a Rubik's cube in less than a second!",
                    "Some robots can do backflips better than Olympic gymnasts!",
                    "There are tiny robots smaller than a grain of salt that can help doctors!"
                ],
                "languages": [
                    "The most commonly used letter in English is 'E'!",
                    "There's a language in Africa that only uses clicking sounds!",
                    "The shortest complete sentence in English is 'Go!'"
                ]
            }

            # Determine which category was clicked
            selected_category = None
            for key, category in category_map.items():
                if key in prompt.lower():
                    selected_category = category
                    break

            # Get a random fact from the appropriate category
            if selected_category and selected_category in fun_facts:
                import random
                return random.choice(fun_facts[selected_category])
            
            # Fallback response
            return "Did you know that astronauts grow taller in space? The lack of gravity makes their spine stretch out!"

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "Oops! I had a little trouble thinking of a fact. Can you try again?" 
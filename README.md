# Luca's Learning Lab 🚀

A local educational app for kids featuring interactive learning games and career exploration. This app runs completely offline and includes fun educational games, text-to-speech capabilities, and an interactive career exploration tool.

## Features

- Educational mini-games like Spelling Bee
- Text-to-speech functionality for accessibility 
- Career exploration tool with detailed profession information
- Progress tracking and learning statistics
- Fun facts about various topics

## Prerequisites

- Python 3.8+
- pip package manager
- Virtual environment (recommended)

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/offline-llm-for-kids.git
   cd offline-llm-for-kids
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database:
   ```bash
   flask db upgrade
   ```

## Running the App

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

- Navigate to the home page to access different learning activities
- Use the Spelling Bee game to practice vocabulary with text-to-speech support
- Explore various career paths in the Career Explorer section
- Track learning progress through the statistics dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

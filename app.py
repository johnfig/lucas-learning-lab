from __init__ import create_app
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)

app = create_app()

if __name__ == '__main__':
    app.run(debug=True) 
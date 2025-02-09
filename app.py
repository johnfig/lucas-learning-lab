from __init__ import create_app
import logging
from flask import send_file, request, jsonify
from gtts import gTTS
import io
import tempfile
import os

# Set up logging
logging.basicConfig(level=logging.DEBUG)

app = create_app()

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        # Create a temporary file to store the audio
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            # Generate speech using gTTS
            tts = gTTS(text=text, lang='en', slow=False)
            tts.save(fp.name)
            
            # Read the file and send it back
            with open(fp.name, 'rb') as audio_file:
                audio_data = io.BytesIO(audio_file.read())
            
            # Clean up the temporary file
            os.unlink(fp.name)
            
            # Return the audio file
            audio_data.seek(0)
            return send_file(
                audio_data,
                mimetype='audio/mpeg',
                as_attachment=True,
                download_name='speech.mp3'
            )
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 
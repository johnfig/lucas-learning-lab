from TTS.api import TTS
import sounddevice as sd
import speech_recognition as sr
import logging

logger = logging.getLogger(__name__)

class SpeechHandler:
    def __init__(self):
        try:
            # Initialize TTS with a basic model that's easier to download
            self.tts = TTS(
                model_name="tts_models/en/ljspeech/tacotron2-DDC",
                progress_bar=True,  # Show download progress
                gpu=False
            )
            
            # Initialize speech recognition
            self.recognizer = sr.Recognizer()
            
            logger.info("Speech handler initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing TTS: {str(e)}")
            raise

    async def speak(self, text: str):
        """Text to speech function using Coqui TTS"""
        try:
            logger.info(f"Generating speech for: {text}")
            
            # Generate speech
            wav = self.tts.tts(text=text)
            
            # Play audio using sounddevice
            sd.play(wav, samplerate=22050)
            sd.wait()  # Wait until audio is finished playing
            
            logger.info("Speech completed successfully")
            
        except Exception as e:
            logger.error(f"Error in speak: {str(e)}")
            raise

    async def listen(self, duration: int = 7) -> str:
        """Speech to text function"""
        try:
            with sr.Microphone() as source:
                self.recognizer.adjust_for_ambient_noise(source)
                audio = self.recognizer.listen(source, timeout=duration)
                text = self.recognizer.recognize_google(audio)
                return text
        except Exception as e:
            logger.error(f"Error in listen: {str(e)}")
            raise 
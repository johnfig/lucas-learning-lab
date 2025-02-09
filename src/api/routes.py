from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize handlers
try:
    from ..ai.model_handler import AIModel
    from ..speech.speech_handler import SpeechHandler
    
    ai_model = AIModel()
    speech_handler = SpeechHandler()
except Exception as e:
    logger.error(f"Failed to initialize handlers: {str(e)}")
    raise

class Question(BaseModel):
    text: str

class SpeechText(BaseModel):
    text: str

@router.post("/ask")
async def ask_question(question: Question):
    try:
        response = ai_model.generate_response(question.text)
        return {"response": response}
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speak")
async def speak_text(speech_text: SpeechText):
    try:
        logger.info(f"Speaking text: {speech_text.text}")
        await speech_handler.speak(speech_text.text)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error in speak_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/listen")
async def listen():
    try:
        text = await speech_handler.listen(duration=7)
        if not text:
            return {"text": "", "status": "no_speech_detected"}
        return {"text": text, "status": "success"}
    except Exception as e:
        logger.error(f"Error in listen: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 
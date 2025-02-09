from flask import jsonify, request, send_file
from database import db
from models import LearningStats
from datetime import datetime, timedelta
from gtts import gTTS
import io
import logging

logger = logging.getLogger(__name__)

def register_routes(app):
    @app.route('/')
    def home():
        return app.send_static_file('index.html')

    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        try:
            user_id = "luca"
            stats = LearningStats.query.filter_by(user_id=user_id).first()
            
            if not stats:
                stats = LearningStats(user_id=user_id)
                db.session.add(stats)
                db.session.commit()
            
            # Update streak
            last_visit = stats.last_visit
            current_time = datetime.utcnow()
            
            if last_visit.date() < current_time.date():
                if last_visit.date() + timedelta(days=1) == current_time.date():
                    stats.streak_days += 1
                else:
                    stats.streak_days = 1
                
                stats.last_visit = current_time
                db.session.commit()
            
            return jsonify(stats.to_dict())
        except Exception as e:
            logger.error(f"Error in get_stats: {str(e)}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    @app.route('/api/stats/update', methods=['POST'])
    def update_stats():
        try:
            data = request.json
            logger.debug(f"Received update request with data: {data}")
            
            user_id = "luca"
            stats = LearningStats.query.filter_by(user_id=user_id).first()
            
            if not stats:
                logger.info(f"Creating new stats record for user: {user_id}")
                stats = LearningStats(user_id=user_id)
                db.session.add(stats)
                db.session.commit()
            
            # Update basic stats
            if 'topics_explored' in data:
                stats.topics_explored = data['topics_explored']
            if 'games_played' in data:
                stats.games_played = data['games_played']
            if 'activity' in data:
                current_activities = stats.activities if stats.activities else []
                stats.activities = [data['activity']] + current_activities[:9]
            
            # Update streak based on activity
            current_time = datetime.utcnow()
            last_visit = stats.last_visit

            # Ensure streak is at least 1 if there's any activity today
            if stats.streak_days == 0 and (stats.topics_explored > 0 or stats.games_played > 0):
                stats.streak_days = 1
                logger.info("Started streak at 1 due to activity")
            elif last_visit:
                # Calculate days between last activity and now
                days_difference = (current_time.date() - last_visit.date()).days
                
                if days_difference == 0:
                    # Same day activity, ensure streak is at least 1
                    if stats.streak_days == 0:
                        stats.streak_days = 1
                        logger.info("Set streak to 1 for today's activity")
                elif days_difference == 1:
                    # Activity on consecutive day, increase streak
                    stats.streak_days += 1
                    logger.info(f"Consecutive day activity, increased streak to {stats.streak_days}")
                elif days_difference > 1:
                    # More than one day gap, reset streak to 1 (not 0)
                    stats.streak_days = 1
                    logger.info("Gap in activity, reset streak to 1")
            
            # Update last visit time
            stats.last_visit = current_time
            
            db.session.commit()
            logger.info("Successfully updated stats")
            
            return jsonify(stats.to_dict())
        except Exception as e:
            logger.error(f"Error in update_stats: {str(e)}", exc_info=True)
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/speak', methods=['POST'])
    def speak():
        try:
            text = request.json.get('text', '')
            tts = gTTS(text=text, lang='en', slow=False)
            mp3_fp = io.BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            return send_file(mp3_fp, mimetype='audio/mpeg', as_attachment=True, download_name='speech.mp3')
        except Exception as e:
            return jsonify({'error': str(e)}), 500 
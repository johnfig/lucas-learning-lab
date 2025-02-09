from flask import jsonify, request, send_file
from database import db
from models import LearningStats
from datetime import datetime, timedelta
from gtts import gTTS
import io
import logging
import random

logger = logging.getLogger(__name__)

# Add topic-specific fun facts
TOPIC_FACTS = {
    'planets': [
        "Venus spins backwards compared to most other planets!",
        "One year on Jupiter is equal to 12 Earth years!",
        "Saturn's rings are mostly made of ice and rock!",
        "Mars has the largest volcano in our solar system - Olympus Mons!",
        "Neptune has the strongest winds in the solar system, reaching 1,200 mph!"
    ],
    'dinosaurs': [
        "T-Rex had teeth as long as bananas!",
        "Some dinosaurs were as small as chickens!",
        "Stegosaurus had a brain the size of a walnut!",
        "Scientists think many dinosaurs had feathers!",
        "The longest dinosaur was the Argentinosaurus, about 115 feet long!"
    ],
    'human body': [
        "Your body has enough iron to make a 3-inch nail!",
        "Your heart beats about 115,000 times each day!",
        "Humans are the only animals that blush!",
        "Your bones are stronger than steel, pound for pound!",
        "You grow about 8 meters of hair every day across your entire body!"
    ],
    'animals': [
        "Sloths can hold their breath for 40 minutes underwater!",
        "Butterflies taste with their feet!",
        "Hippos secrete their own sunscreen - a pink liquid!",
        "A group of flamingos is called a 'flamboyance'!",
        "Octopuses have three hearts and blue blood!"
    ],
    'weather': [
        "Lightning strikes Earth about 100 times every second!",
        "A hurricane can dump 2.4 trillion gallons of rain a day!",
        "The fastest wind ever recorded was 253 miles per hour!",
        "Raindrops can fall at up to 20 miles per hour!",
        "Thunder can be heard from about 12 miles away!"
    ],
    'ocean life': [
        "The blue whale's tongue weighs as much as an elephant!",
        "Some jellyfish are immortal!",
        "Octopuses have nine brains!",
        "Seahorses are the only fish species where males give birth!",
        "The loudest animal in the ocean is the sperm whale!"
    ],
    'plants': [
        "Bamboo can grow up to 35 inches in a single day!",
        "Some trees communicate with each other through their roots!",
        "The oldest living tree is over 5,000 years old!",
        "Plants can recognize their siblings!",
        "Some plants can count!"
    ],
    'space exploration': [
        "The first animal in space was a dog named Laika!",
        "One day on Venus is longer than its year!",
        "Astronauts grow taller in space!",
        "The footprints on the Moon will last for 100 million years!",
        "The space suit astronauts wear weighs about 280 pounds on Earth!"
    ]
}

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

    @app.route('/api/ask', methods=['POST'])
    def ask_question():
        try:
            data = request.json
            topic = data.get('text', '').lower()
            
            # Extract topic name from the question
            for key in TOPIC_FACTS.keys():
                if key in topic:
                    facts = TOPIC_FACTS[key]
                    response = random.choice(facts)
                    return jsonify({
                        'success': True,
                        'response': response,
                        'topic': key
                    })
            
            # Fallback for unknown topics
            return jsonify({
                'success': True,
                'response': "I don't have any facts about that topic yet. Try another one!",
                'topic': 'general'
            })
            
        except Exception as e:
            logger.error(f"Error in ask_question: {str(e)}", exc_info=True)
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500 
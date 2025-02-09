from datetime import datetime
from database import db

class LearningStats(db.Model):
    __tablename__ = 'learning_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    topics_explored = db.Column(db.Integer, default=0)
    games_played = db.Column(db.Integer, default=0)
    streak_days = db.Column(db.Integer, default=0)
    last_visit = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    activities = db.Column(db.JSON, default=list)

    def __init__(self, user_id):
        self.user_id = user_id
        self.topics_explored = 0
        self.games_played = 0
        self.streak_days = 0
        self.last_visit = datetime.utcnow()
        self.activities = []

    def to_dict(self):
        return {
            'topics_explored': self.topics_explored,
            'games_played': self.games_played,
            'streak_days': self.streak_days,
            'last_visit': self.last_visit.isoformat(),
            'activities': self.activities or []
        } 
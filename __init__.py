from flask import Flask
from database import db
import os

def create_app():
    app = Flask(__name__)
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/learning_lab.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = True

    # Initialize the database
    db.init_app(app)

    # Make sure instance folder exists
    if not os.path.exists('instance'):
        os.makedirs('instance')

    # Import routes after db initialization
    from routes import register_routes
    register_routes(app)

    # Create database tables
    with app.app_context():
        db.create_all()

    return app 
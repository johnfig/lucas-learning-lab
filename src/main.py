from flask import Flask
from database import db
import os

def create_app():
    app = Flask(__name__, static_folder='../static')
    
    # Create instance directory with full permissions
    instance_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance')
    if not os.path.exists(instance_path):
        os.makedirs(instance_path, mode=0o777)
    
    # Database configuration
    db_path = os.path.join(instance_path, 'learning_lab.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = True

    # Initialize the database
    db.init_app(app)

    # Import routes after db initialization
    from routes import register_routes
    register_routes(app)

    # Create database tables
    with app.app_context():
        try:
            db.create_all()
            print(f"Database initialized at {db_path}")
        except Exception as e:
            print(f"Error creating database: {e}")
            # Ensure the directory is writable
            os.chmod(instance_path, 0o777)
            db.create_all()

    return app

app = create_app() 
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import sys
import os

# Add the parent directory to the path so we can import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.config import config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    jwt.init_app(app)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.patients import patients_bp
    from app.routes.appointments import appointments_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    
    return app
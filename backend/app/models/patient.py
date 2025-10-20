import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from datetime import datetime

class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.Integer, primary_key=True)
    opd_id = db.Column(db.String(20), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.Enum('male', 'female', 'other'), nullable=False)
    contact_number = db.Column(db.String(15), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    address = db.Column(db.Text, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    appointments = db.relationship('Appointment', backref='patient', lazy=True)
    
    def __repr__(self):
        return f'<Patient {self.full_name}>'
from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum('patient', 'doctor', 'staff', 'admin'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    patient_profile = db.relationship('Patient', backref='user', uselist=False, lazy=True, cascade="all, delete-orphan")
    doctor_profile = db.relationship('Doctor', backref='user', uselist=False, lazy=True, cascade="all, delete-orphan")
    staff_profile = db.relationship('Staff', backref='user', uselist=False, lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<User {self.username} ({self.role})>'

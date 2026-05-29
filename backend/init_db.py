import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
import bcrypt
from app.models.user import User
from app.models.doctor import Doctor
from app.models.staff import Staff

app = create_app()

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Creating all tables...")
    db.create_all()
    
    print("Creating default admin...")
    admin_pw = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    admin = User(username='admin', email='admin@hospital.com', password_hash=admin_pw, role='admin')
    db.session.add(admin)
    db.session.flush()
    
    print("Creating default doctor...")
    doc_pw = bcrypt.hashpw('doc123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    doctor_user = User(username='dr.smith', email='smith@hospital.com', password_hash=doc_pw, role='doctor')
    db.session.add(doctor_user)
    db.session.flush()
    doctor = Doctor(user_id=doctor_user.id, full_name='Dr. Smith', specialty='Ophthalmology', contact_number='0771234567')
    db.session.add(doctor)
    
    db.session.commit()
    print("Database initialized successfully!")

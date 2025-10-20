from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.patient import Patient
import bcrypt
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400
        
        patient = Patient.query.filter_by(username=username).first()
        
        if patient and bcrypt.checkpw(password.encode('utf-8'), patient.password_hash):
            access_token = create_access_token(identity=patient.id)
            return jsonify({
                'access_token': access_token,
                'patient': {
                    'id': patient.id,
                    'full_name': patient.full_name,
                    'opd_id': patient.opd_id,
                    'email': patient.email
                }
            }), 200
        
        return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fullName', 'dateOfBirth', 'gender', 'contactNumber', 'email', 'address', 'username', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if username or email already exists
        existing_patient = Patient.query.filter(
            (Patient.username == data['username']) | 
            (Patient.email == data['email'])
        ).first()
        
        if existing_patient:
            return jsonify({'message': 'Username or email already exists'}), 400
        
        # Generate OPD ID
        opd_id = f"OPD{datetime.now().strftime('%Y%m%d')}{Patient.query.count() + 1:04d}"
        
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Create patient
        patient = Patient(
            opd_id=opd_id,
            full_name=data['fullName'],
            date_of_birth=datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date(),
            gender=data['gender'],
            contact_number=data['contactNumber'],
            email=data['email'],
            address=data['address'],
            username=data['username'],
            password_hash=password_hash
        )
        
        db.session.add(patient)
        db.session.commit()
        
        return jsonify({
            'message': 'Patient registered successfully',
            'opd_id': opd_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        patient_id = get_jwt_identity()
        patient = Patient.query.get(patient_id)
        
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        return jsonify({
            'id': patient.id,
            'opd_id': patient.opd_id,
            'full_name': patient.full_name,
            'date_of_birth': patient.date_of_birth.isoformat(),
            'gender': patient.gender,
            'contact_number': patient.contact_number,
            'email': patient.email,
            'address': patient.address,
            'username': patient.username,
            'created_at': patient.created_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to get profile', 'error': str(e)}), 500
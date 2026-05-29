from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.staff import Staff
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
        
        user = User.query.filter((User.username == username) | (User.email == username)).first()
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            additional_claims = {"role": user.role}
            access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
            
            response_data = {
                'access_token': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                }
            }
            
            # Fetch profile based on role
            if user.role == 'patient':
                if user.patient_profile:
                    response_data['user']['full_name'] = user.patient_profile.full_name
                    response_data['user']['opd_id'] = user.patient_profile.opd_id
            elif user.role == 'doctor':
                if user.doctor_profile:
                    response_data['user']['full_name'] = user.doctor_profile.full_name
            elif user.role == 'staff':
                if user.staff_profile:
                    response_data['user']['full_name'] = user.staff_profile.full_name

            return jsonify(response_data), 200
        
        return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields for patient registration (assuming public reg is only for patients)
        required_fields = ['fullName', 'dateOfBirth', 'gender', 'contactNumber', 'email', 'address', 'username', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if username or email already exists
        existing_user = User.query.filter(
            (User.username == data['username']) | 
            (User.email == data['email'])
        ).first()
        
        if existing_user:
            return jsonify({'message': 'Username or email already exists'}), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create User
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=password_hash,
            role='patient'
        )
        
        db.session.add(user)
        db.session.flush() # To get user.id
        
        # Generate OPD ID
        opd_id = f"OPD{datetime.now().strftime('%Y%m%d')}{Patient.query.count() + 1:04d}"
        
        # Create patient
        patient = Patient(
            user_id=user.id,
            opd_id=opd_id,
            full_name=data['fullName'],
            date_of_birth=datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date(),
            gender=data['gender'],
            contact_number=data['contactNumber'],
            address=data['address']
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
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        profile_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'created_at': user.created_at.isoformat()
        }
        
        if user.role == 'patient' and user.patient_profile:
            p = user.patient_profile
            profile_data.update({
                'patient_id': p.id,
                'opd_id': p.opd_id,
                'full_name': p.full_name,
                'date_of_birth': p.date_of_birth.isoformat(),
                'gender': p.gender,
                'contact_number': p.contact_number,
                'address': p.address
            })
        elif user.role == 'doctor' and user.doctor_profile:
            d = user.doctor_profile
            profile_data.update({
                'doctor_id': d.id,
                'full_name': d.full_name,
                'specialty': d.specialty,
                'contact_number': d.contact_number
            })
        elif user.role == 'staff' and user.staff_profile:
            s = user.staff_profile
            profile_data.update({
                'staff_id': s.id,
                'full_name': s.full_name,
                'contact_number': s.contact_number
            })
            
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to get profile', 'error': str(e)}), 500
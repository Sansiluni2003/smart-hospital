from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.staff import Staff
import bcrypt

admin_bp = Blueprint('admin', __name__)

def is_admin():
    claims = get_jwt()
    return claims.get('role') == 'admin'

@admin_bp.route('/register-staff', methods=['POST'])
@jwt_required()
def register_staff():
    if not is_admin():
        return jsonify({'message': 'Admin privileges required'}), 403
        
    try:
        data = request.get_json()
        required_fields = ['username', 'email', 'password', 'role', 'fullName', 'contactNumber']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
                
        if data['role'] not in ['doctor', 'staff']:
            return jsonify({'message': 'Role must be doctor or staff'}), 400
            
        existing_user = User.query.filter((User.username == data['username']) | (User.email == data['email'])).first()
        if existing_user:
            return jsonify({'message': 'Username or email already exists'}), 400
            
        password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=password_hash,
            role=data['role']
        )
        db.session.add(user)
        db.session.flush()
        
        if data['role'] == 'doctor':
            if 'specialty' not in data:
                db.session.rollback()
                return jsonify({'message': 'specialty is required for doctors'}), 400
            doctor = Doctor(
                user_id=user.id,
                full_name=data['fullName'],
                specialty=data['specialty'],
                contact_number=data['contactNumber']
            )
            db.session.add(doctor)
        else:
            staff = Staff(
                user_id=user.id,
                full_name=data['fullName'],
                contact_number=data['contactNumber']
            )
            db.session.add(staff)
            
        db.session.commit()
        return jsonify({'message': f"{data['role'].capitalize()} registered successfully"}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    if not is_admin():
        return jsonify({'message': 'Admin privileges required'}), 403
        
    try:
        users = User.query.filter(User.role.in_(['doctor', 'staff'])).all()
        user_list = []
        for u in users:
            name = ""
            if u.role == 'doctor' and u.doctor_profile:
                name = u.doctor_profile.full_name
            elif u.role == 'staff' and u.staff_profile:
                name = u.staff_profile.full_name
                
            user_list.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'role': u.role,
                'full_name': name,
                'created_at': u.created_at.isoformat()
            })
            
        return jsonify(user_list), 200
    except Exception as e:
        return jsonify({'message': 'Failed to fetch users', 'error': str(e)}), 500

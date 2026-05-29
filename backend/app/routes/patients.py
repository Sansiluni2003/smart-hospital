from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.user import User
from app.models.patient import Patient

patients_bp = Blueprint('patients', __name__)

@patients_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_patients():
    try:
        # Only staff or admin should see all patients
        claims = get_jwt()
        if claims.get('role') not in ['staff', 'admin', 'doctor']:
            return jsonify({'message': 'Unauthorized access'}), 403
            
        patients = Patient.query.all()
        patients_list = []
        
        for patient in patients:
            patients_list.append({
                'id': patient.id,
                'user_id': patient.user_id,
                'opd_id': patient.opd_id,
                'full_name': patient.full_name,
                'email': patient.user.email if patient.user else '',
                'contact_number': patient.contact_number,
                'created_at': patient.created_at.isoformat()
            })
        
        return jsonify(patients_list), 200
    except Exception as e:
        return jsonify({'message': 'Failed to get patients', 'error': str(e)}), 500

@patients_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    try:
        patient = Patient.query.get(patient_id)
        
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
            
        # Optional: Add authorization to check if user requesting is the patient, doctor, or staff.
        
        return jsonify({
            'id': patient.id,
            'user_id': patient.user_id,
            'opd_id': patient.opd_id,
            'full_name': patient.full_name,
            'date_of_birth': patient.date_of_birth.isoformat(),
            'gender': patient.gender,
            'contact_number': patient.contact_number,
            'email': patient.user.email if patient.user else '',
            'address': patient.address,
            'username': patient.user.username if patient.user else '',
            'created_at': patient.created_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to get patient', 'error': str(e)}), 500

@patients_bp.route('/<int:patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        patient = Patient.query.get(patient_id)
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
            
        # Only allow patients to update their own profile or staff/admin
        if patient.user_id != user_id and claims.get('role') not in ['staff', 'admin']:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        if 'full_name' in data:
            patient.full_name = data['full_name']
        if 'contact_number' in data:
            patient.contact_number = data['contact_number']
        if 'email' in data:
            # Update user email
            existing = User.query.filter(User.email == data['email'], User.id != patient.user_id).first()
            if existing:
                return jsonify({'message': 'Email already in use'}), 400
            patient.user.email = data['email']
        if 'address' in data:
            patient.address = data['address']
        
        db.session.commit()
        
        return jsonify({'message': 'Patient updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update patient', 'error': str(e)}), 500
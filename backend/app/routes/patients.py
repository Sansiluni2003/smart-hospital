from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.patient import Patient

patients_bp = Blueprint('patients', __name__)

@patients_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_patients():
    try:
        patients = Patient.query.all()
        patients_list = []
        
        for patient in patients:
            patients_list.append({
                'id': patient.id,
                'opd_id': patient.opd_id,
                'full_name': patient.full_name,
                'email': patient.email,
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
        return jsonify({'message': 'Failed to get patient', 'error': str(e)}), 500

@patients_bp.route('/<int:patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    try:
        current_patient_id = get_jwt_identity()
        
        # Only allow patients to update their own profile
        if current_patient_id != patient_id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        patient = Patient.query.get(patient_id)
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'full_name' in data:
            patient.full_name = data['full_name']
        if 'contact_number' in data:
            patient.contact_number = data['contact_number']
        if 'email' in data:
            # Check if email is already taken by another patient
            existing = Patient.query.filter(Patient.email == data['email'], Patient.id != patient_id).first()
            if existing:
                return jsonify({'message': 'Email already in use'}), 400
            patient.email = data['email']
        if 'address' in data:
            patient.address = data['address']
        
        db.session.commit()
        
        return jsonify({'message': 'Patient updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update patient', 'error': str(e)}), 500
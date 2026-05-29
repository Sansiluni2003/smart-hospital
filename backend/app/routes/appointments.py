from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.appointment import Appointment
from app.models.user import User
from app.models.doctor import Doctor
from datetime import datetime

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'patient' or not user.patient_profile:
            return jsonify({'message': 'Only patients can book appointments directly'}), 403
            
        patient_id = user.patient_profile.id
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['doctor_id', 'appointment_date', 'appointment_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
                
        doctor = Doctor.query.get(data['doctor_id'])
        if not doctor:
            return jsonify({'message': 'Doctor not found'}), 404
        
        # Create appointment
        appointment = Appointment(
            patient_id=patient_id,
            doctor_id=doctor.id,
            appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d').date(),
            appointment_time=datetime.strptime(data['appointment_time'], '%H:%M').time(),
            location=data.get('location', ''),
            notes=data.get('notes', '')
        )
        
        # Generate queue number (count of appointments for that date + 1)
        same_date_appointments = Appointment.query.filter_by(
            appointment_date=appointment.appointment_date,
            doctor_id=doctor.id
        ).count()
        appointment.queue_number = same_date_appointments + 1
        
        db.session.add(appointment)
        db.session.commit()
        
        return jsonify({
            'message': 'Appointment created successfully',
            'appointment_id': appointment.id,
            'queue_number': appointment.queue_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to create appointment', 'error': str(e)}), 500

@appointments_bp.route('/', methods=['GET'])
@jwt_required()
def get_patient_appointments():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role != 'patient' or not user.patient_profile:
            return jsonify({'message': 'Profile not found'}), 404
            
        appointments = Appointment.query.filter_by(patient_id=user.patient_profile.id).order_by(
            Appointment.appointment_date.desc()
        ).all()
        
        appointments_list = []
        for appointment in appointments:
            doctor = Doctor.query.get(appointment.doctor_id)
            appointments_list.append({
                'id': appointment.id,
                'doctor_id': appointment.doctor_id,
                'doctor_name': doctor.full_name if doctor else 'Unknown',
                'specialty': doctor.specialty if doctor else 'Unknown',
                'appointment_date': appointment.appointment_date.isoformat(),
                'appointment_time': appointment.appointment_time.strftime('%H:%M'),
                'status': appointment.status,
                'queue_number': appointment.queue_number,
                'location': appointment.location,
                'notes': appointment.notes,
                'created_at': appointment.created_at.isoformat()
            })
        
        return jsonify(appointments_list), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to get appointments', 'error': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment_status(appointment_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        # Verify permissions
        if user.role == 'patient':
            if appointment.patient_id != user.patient_profile.id:
                return jsonify({'message': 'Unauthorized'}), 403
            # Patients can only cancel
            if data.get('status') != 'cancelled':
                return jsonify({'message': 'Patients can only cancel appointments'}), 403
        elif user.role == 'doctor':
            if appointment.doctor_id != user.doctor_profile.id:
                return jsonify({'message': 'Unauthorized'}), 403
                
        if 'status' in data:
            if data['status'] in ['scheduled', 'completed', 'cancelled']:
                appointment.status = data['status']
            else:
                return jsonify({'message': 'Invalid status'}), 400
        
        db.session.commit()
        
        return jsonify({'message': 'Appointment updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update appointment', 'error': str(e)}), 500

@appointments_bp.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(appointment_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        if user.role == 'patient' and appointment.patient_id != user.patient_profile.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        appointment.status = 'cancelled'
        db.session.commit()
        
        return jsonify({'message': 'Appointment cancelled successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to cancel appointment', 'error': str(e)}), 500
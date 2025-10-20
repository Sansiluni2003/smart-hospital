from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.appointment import Appointment
from app.models.patient import Patient
from datetime import datetime

appointments_bp = Blueprint('appointments', __name__)

@appointments_bp.route('/', methods=['POST'])
@jwt_required()
def create_appointment():
    try:
        patient_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['doctor_name', 'specialty', 'appointment_date', 'appointment_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Create appointment
        appointment = Appointment(
            patient_id=patient_id,
            doctor_name=data['doctor_name'],
            specialty=data['specialty'],
            appointment_date=datetime.strptime(data['appointment_date'], '%Y-%m-%d').date(),
            appointment_time=datetime.strptime(data['appointment_time'], '%H:%M').time(),
            location=data.get('location', ''),
            notes=data.get('notes', '')
        )
        
        # Generate queue number (count of appointments for that date + 1)
        same_date_appointments = Appointment.query.filter_by(
            appointment_date=appointment.appointment_date
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
        patient_id = get_jwt_identity()
        appointments = Appointment.query.filter_by(patient_id=patient_id).order_by(
            Appointment.appointment_date.desc()
        ).all()
        
        appointments_list = []
        for appointment in appointments:
            appointments_list.append({
                'id': appointment.id,
                'doctor_name': appointment.doctor_name,
                'specialty': appointment.specialty,
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
        patient_id = get_jwt_identity()
        data = request.get_json()
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        # Only allow patient to update their own appointments
        if appointment.patient_id != patient_id:
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
        patient_id = get_jwt_identity()
        
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
        
        # Only allow patient to cancel their own appointments
        if appointment.patient_id != patient_id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        appointment.status = 'cancelled'
        db.session.commit()
        
        return jsonify({'message': 'Appointment cancelled successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to cancel appointment', 'error': str(e)}), 500
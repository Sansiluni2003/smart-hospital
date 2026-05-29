from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app import db
from app.models.queue import QueueEntry
from app.models.appointment import Appointment
from app.models.user import User
from app.models.doctor import Doctor
from app.models.patient import Patient
from datetime import datetime

queue_bp = Blueprint('queue', __name__)

@queue_bp.route('/arrive', methods=['POST'])
@jwt_required()
def confirm_arrival():
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        data = request.get_json()
        
        # Expect an appointment_id, either from the patient scanning themselves or staff scanning them
        appointment_id = data.get('appointment_id')
        if not appointment_id:
            return jsonify({'message': 'appointment_id is required'}), 400
            
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({'message': 'Appointment not found'}), 404
            
        # Security checks
        if claims.get('role') == 'patient':
            user = User.query.get(user_id)
            if appointment.patient_id != user.patient_profile.id:
                return jsonify({'message': 'Unauthorized'}), 403
        elif claims.get('role') not in ['staff', 'admin']:
            return jsonify({'message': 'Unauthorized'}), 403
            
        # Check if already in queue
        existing_entry = QueueEntry.query.filter_by(appointment_id=appointment.id).first()
        if existing_entry:
            return jsonify({'message': 'Already in queue', 'queue_number': existing_entry.queue_number}), 400
            
        # Only allow arrival on the same day (for simplicity, we can just allow it here or enforce strict date checks)
        # if appointment.appointment_date != datetime.utcnow().date():
        #     return jsonify({'message': 'Can only arrive on the date of appointment'}), 400
        
        # Add to queue
        queue_entry = QueueEntry(
            appointment_id=appointment.id,
            doctor_id=appointment.doctor_id,
            queue_number=appointment.queue_number,
            status='waiting'
        )
        
        db.session.add(queue_entry)
        db.session.commit()
        
        return jsonify({
            'message': 'Arrival confirmed, added to queue',
            'queue_number': queue_entry.queue_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to confirm arrival', 'error': str(e)}), 500

@queue_bp.route('/live/<int:doctor_id>', methods=['GET'])
@jwt_required()
def get_live_queue(doctor_id):
    try:
        # Fetch the active queue for a specific doctor
        entries = QueueEntry.query.filter(
            QueueEntry.doctor_id == doctor_id,
            QueueEntry.status.in_(['waiting', 'in-consultation'])
        ).order_by(QueueEntry.queue_number.asc()).all()
        
        queue_list = []
        for entry in entries:
            patient = Patient.query.get(entry.appointment.patient_id)
            queue_list.append({
                'queue_id': entry.id,
                'appointment_id': entry.appointment_id,
                'queue_number': entry.queue_number,
                'status': entry.status,
                'patient_name': patient.full_name,
                'arrived_at': entry.arrived_at.isoformat()
            })
            
        return jsonify(queue_list), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch queue', 'error': str(e)}), 500

@queue_bp.route('/<int:queue_id>/status', methods=['PUT'])
@jwt_required()
def update_queue_status(queue_id):
    try:
        claims = get_jwt()
        if claims.get('role') not in ['staff', 'doctor', 'admin']:
            return jsonify({'message': 'Unauthorized'}), 403
            
        data = request.get_json()
        status = data.get('status')
        if status not in ['waiting', 'in-consultation', 'completed', 'skipped']:
            return jsonify({'message': 'Invalid status'}), 400
            
        entry = QueueEntry.query.get(queue_id)
        if not entry:
            return jsonify({'message': 'Queue entry not found'}), 404
            
        entry.status = status
        
        # If completed, also update appointment status
        if status == 'completed':
            entry.appointment.status = 'completed'
            
        db.session.commit()
        
        return jsonify({'message': f'Queue status updated to {status}'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update status', 'error': str(e)}), 500

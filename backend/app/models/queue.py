from app import db
from datetime import datetime

class QueueEntry(db.Model):
    __tablename__ = 'queue_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), unique=True, nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    queue_number = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum('waiting', 'in-consultation', 'completed', 'skipped'), default='waiting')
    arrived_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    appointment = db.relationship('Appointment', backref=db.backref('queue_entry', uselist=False))
    
    def __repr__(self):
        return f'<QueueEntry {self.queue_number} - Status: {self.status}>'

import os
import vonage
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.models.notification import Notification, NotificationType, NotificationStatus
from datetime import datetime

# Vonage (SMS)
VONAGE_API_KEY = os.getenv("VONAGE_API_KEY")
VONAGE_API_SECRET = os.getenv("VONAGE_API_SECRET")
VONAGE_FROM_NUMBER = os.getenv("VONAGE_FROM_NUMBER")

# SendGrid (Email)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")

def send_sms(to_number, message):
    client = vonage.Client(key=VONAGE_API_KEY, secret=VONAGE_API_SECRET)
    sms = vonage.Sms(client)
    response = sms.send_message({
        "from": VONAGE_FROM_NUMBER,
        "to": to_number,
        "text": message,
    })
    return response

def send_email(to_email, subject, content):
    message = Mail(
        from_email=SENDGRID_FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        plain_text_content=content
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code
    except Exception as e:
        return str(e)

def create_in_app_notification(db, patient_id, message):
    notification = Notification(
        Patient_ID=patient_id,
        Message=message,
        NotificationType=NotificationType.Web,
        Status=NotificationStatus.Sent,
        Sent_Time=datetime.utcnow()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
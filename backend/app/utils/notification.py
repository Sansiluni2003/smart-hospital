import os
import ssl
import certifi
from vonage import Vonage, Auth
from vonage_sms import SmsMessage
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.models.notification import Notification, NotificationType, NotificationStatus
from datetime import datetime

# Patch SSL on Windows so every HTTPS library (httpx, requests, urllib3) uses certifi certs.
# Must be done before any client is instantiated.
_ca = certifi.where()
os.environ.setdefault("SSL_CERT_FILE", _ca)
os.environ.setdefault("REQUESTS_CA_BUNDLE", _ca)
os.environ.setdefault("HTTPX_CA_BUNDLE", _ca)

_orig_create_default_context = ssl.create_default_context
def _patched_ssl_context(*args, **kwargs):
    kwargs.setdefault("cafile", _ca)
    return _orig_create_default_context(*args, **kwargs)
ssl.create_default_context = _patched_ssl_context

# Vonage (SMS)
VONAGE_API_KEY = os.getenv("VONAGE_API_KEY")
VONAGE_API_SECRET = os.getenv("VONAGE_API_SECRET")
VONAGE_FROM_NUMBER = os.getenv("VONAGE_FROM_NUMBER", "")

# SendGrid (Email)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")

def _normalize_phone(number: str) -> str:
    """Convert a local SL number (0712900068) to E.164 without + (94712900068)."""
    n = str(number).strip().replace(" ", "").replace("-", "")
    if n.startswith("+"):
        n = n[1:]
    elif n.startswith("0") and len(n) == 10:  # local format 07xxxxxxxx → 947xxxxxxxx
        n = "94" + n[1:]
    return n

def send_sms(to_number: str, message: str):
    try:
        if not VONAGE_API_KEY or not VONAGE_API_SECRET:
            print("[SMS] Vonage credentials not configured.")
            return None
        client = Vonage(Auth(api_key=VONAGE_API_KEY, api_secret=VONAGE_API_SECRET))
        from_num = _normalize_phone(VONAGE_FROM_NUMBER)
        to_num = _normalize_phone(to_number)
        response = client.sms.send(SmsMessage(to=to_num, from_=from_num, text=message))
        print(f"[SMS] Sent to {to_num}: {response}")
        return response
    except Exception as e:
        print(f"[SMS] Failed to send SMS: {e}")
        return None

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

def create_in_app_notification(db, patient_id, message, ntype=None):
    notification = Notification(
        Patient_ID=patient_id,
        Message=message,
        NotificationType=ntype or NotificationType.SMS,
        Status=NotificationStatus.Sent,
        Sent_Time=datetime.utcnow()
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
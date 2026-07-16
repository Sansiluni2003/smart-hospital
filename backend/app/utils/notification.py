import os
import ssl
import sys

# On Windows/corporate networks the system trust store (including corporate CAs)
# must be injected into Python's ssl module so outbound HTTPS succeeds.
try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass  # truststore not installed – fall back to env-based CA bundle below

from vonage import Vonage, Auth
from vonage_sms import SmsMessage
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.models.notification import Notification, NotificationType, NotificationStatus
from datetime import datetime

# TLS configuration:
# - By default, use Python/OS trust store (important on Windows/corporate networks).
# - If CUSTOM_CA_BUNDLE is provided, enforce that CA bundle for outbound HTTPS.
_custom_ca = os.getenv("CUSTOM_CA_BUNDLE", "").strip()
_ca = _custom_ca if (_custom_ca and os.path.exists(_custom_ca)) else None

if _ca:
    os.environ["SSL_CERT_FILE"] = _ca
    os.environ["REQUESTS_CA_BUNDLE"] = _ca
    os.environ["HTTPX_CA_BUNDLE"] = _ca

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
        # Inject Windows/system trust store on every call – idempotent and
        # necessary when the server started before truststore was installed.
        try:
            import truststore as _ts
            _ts.inject_into_ssl()
        except ImportError:
            pass

        # Read credentials fresh each call so .env changes / late dotenv load
        # are always picked up without requiring a server restart.
        from dotenv import load_dotenv as _ld
        _ld(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'), override=False)
        api_key = os.getenv("VONAGE_API_KEY")
        api_secret = os.getenv("VONAGE_API_SECRET")
        from_number = os.getenv("VONAGE_FROM_NUMBER", "")

        if not api_key or not api_secret:
            print("[SMS] Vonage credentials not configured.")
            return None

        client = Vonage(Auth(api_key=api_key, api_secret=api_secret))

        # ── Pre-flight balance check ────────────────────────────────────────
        # Sri Lanka (LK) outbound SMS costs ~0.42 EUR each.
        # Block immediately if balance is below that threshold so the account
        # does not go into a negative state that prevents ALL future calls.
        SMS_MIN_BALANCE_EUR = float(os.getenv("SMS_MIN_BALANCE_EUR", "0.45"))
        try:
            bal = client.account.get_balance()
            balance_eur = float(bal.value)
            if balance_eur < SMS_MIN_BALANCE_EUR:
                print(
                    f"[SMS] BLOCKED – Vonage balance {balance_eur:.5f} EUR is below the minimum "
                    f"{SMS_MIN_BALANCE_EUR} EUR needed for one Sri Lanka SMS (cost ~0.42 EUR). "
                    "Top up at https://dashboard.nexmo.com/billing-and-payments"
                )
                return None
        except Exception as bal_err:
            print(f"[SMS] Could not check balance: {bal_err}")

        from_num = _normalize_phone(from_number)
        to_num = _normalize_phone(to_number)
        response = client.sms.send(SmsMessage(to=to_num, from_=from_num, text=message))
        print(f"[SMS] Response to {to_num}: {response}")

        # ── Check per-message delivery status ──────────────────────────────
        # Vonage status 0 = delivered; anything else is an error.
        # Common failure codes:
        #   4  = Invalid credentials
        #   9  = Partner quota exceeded / insufficient funds
        #   17 = Message blocked by carrier
        for msg in response.messages:
            status = int(msg.status) if msg.status is not None else -1
            if status != 0:
                print(
                    f"[SMS] FAILED – status code {status} for {to_num}. "
                    "Code 9 = insufficient Vonage funds. "
                    "See: https://developer.vonage.com/messaging/sms/guides/troubleshooting-sms"
                )
                return None
            try:
                remaining = float(msg.remaining_balance)
                if remaining < 0:
                    print(
                        f"[SMS] WARNING – Account balance went NEGATIVE ({remaining:.5f} EUR) after this SMS. "
                        "Top up immediately at https://dashboard.nexmo.com/billing-and-payments"
                    )
                elif remaining < 0.50:
                    print(f"[SMS] WARNING – Low balance: {remaining:.5f} EUR remaining.")
            except Exception:
                pass

        return response
    except Exception as e:
        print(
            f"[SMS] Failed to send SMS: {e} | CA mode: {'CUSTOM_CA_BUNDLE' if _ca else 'SYSTEM_TRUST_STORE'}. "
            "If you are on a corporate/proxy network, set CUSTOM_CA_BUNDLE to your root CA PEM path."
        )
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
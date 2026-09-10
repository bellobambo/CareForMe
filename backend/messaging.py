import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()


def _twilio_client():
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        return None

    from twilio.rest import Client

    return Client(account_sid, auth_token)


def send_sms(to: str, body: str) -> dict[str, Any]:
    """Send an SMS, or return a deterministic dry-run result without credentials."""
    if os.getenv("TWILIO_ENABLED", "false").lower() != "true":
        print(f"--- DRY-RUN SMS TO {to} ---\n{body}\n---------------------------")
        return {"status": "DRY_RUN", "sid": None, "to": to}

    from_number = os.getenv("TWILIO_FROM_NUMBER")
    if not from_number:
        raise RuntimeError("TWILIO_FROM_NUMBER is required when Twilio is enabled")

    client = _twilio_client()
    if client is None:
        raise RuntimeError("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required")

    # If using Twilio WhatsApp sandbox, ensure the 'to' number has the whatsapp: prefix
    if from_number.startswith("whatsapp:") and not to.startswith("whatsapp:"):
        to = f"whatsapp:{to}"

    message = client.messages.create(body=body, from_=from_number, to=to)
    return {"status": "SENT", "sid": message.sid, "to": to}

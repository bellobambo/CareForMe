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


def _delivery_channel(preferred_contact_method: str) -> str:
    channel = preferred_contact_method.upper()
    if channel in {"SMS", "TEXT"}:
        return "SMS"
    if channel == "WHATSAPP":
        return "WHATSAPP"
    raise ValueError(f"Unsupported contact method: {preferred_contact_method}")


def _from_number(channel: str) -> str:
    """Return the sender configured for the requested delivery channel."""
    legacy_from_number = os.getenv("TWILIO_FROM_NUMBER")
    if channel == "SMS":
        from_number = os.getenv("TWILIO_SMS_FROM_NUMBER") or legacy_from_number
        if not from_number:
            raise RuntimeError("TWILIO_SMS_FROM_NUMBER is required for SMS delivery")
        if from_number.startswith("whatsapp:"):
            raise RuntimeError("TWILIO_SMS_FROM_NUMBER must be an SMS-capable phone number, not a WhatsApp sender")
        return from_number

    from_number = os.getenv("TWILIO_WHATSAPP_FROM_NUMBER")
    if not from_number and legacy_from_number and legacy_from_number.startswith("whatsapp:"):
        from_number = legacy_from_number
    if not from_number:
        raise RuntimeError("TWILIO_WHATSAPP_FROM_NUMBER is required for WhatsApp delivery")
    return from_number if from_number.startswith("whatsapp:") else f"whatsapp:{from_number}"


def send_patient_message(to: str, body: str, preferred_contact_method: str) -> dict[str, Any]:
    """Deliver through the patient's selected SMS or WhatsApp channel."""
    channel = _delivery_channel(preferred_contact_method)
    if os.getenv("TWILIO_ENABLED", "false").lower() != "true":
        print(f"--- DRY-RUN {channel} TO {to} ---\n{body}\n---------------------------")
        return {"status": "DRY_RUN", "sid": None, "to": to, "channel": channel}

    from_number = _from_number(channel)

    client = _twilio_client()
    if client is None:
        raise RuntimeError("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required")

    if channel == "WHATSAPP" and not to.startswith("whatsapp:"):
        to = f"whatsapp:{to}"

    message = client.messages.create(body=body, from_=from_number, to=to)
    return {"status": "SENT", "sid": message.sid, "to": to, "channel": channel}


def send_sms(to: str, body: str) -> dict[str, Any]:
    """Backward-compatible helper for callers that must always use SMS."""
    return send_patient_message(to, body, "SMS")

import os
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import database
import messaging


def _patient_phone(patient: dict) -> str | None:
    preference = _patient_delivery_channel(patient)
    phone = patient.get('phone') or patient.get('contact')
    if preference is None or not phone:
        return None
    return phone


def _patient_delivery_channel(patient: dict) -> str | None:
    preference = str(patient.get('preferred_contact_method', 'SMS')).upper()
    if preference in {'SMS', 'TEXT'}:
        return 'SMS'
    if preference == 'WHATSAPP':
        return 'WHATSAPP'
    return None


def send_patient_sms(clinic_id: str, patient_id: str, body: str) -> dict[str, Any]:
    patient = database.get_patient(clinic_id, patient_id)
    if not patient:
        return {'status': 'FAILED', 'reason': 'Patient not found'}
    phone = _patient_phone(patient)
    channel = _patient_delivery_channel(patient)
    if not phone or not channel:
        return {'status': 'SKIPPED', 'reason': 'Patient has no supported phone contact method or has opted out'}
    return messaging.send_patient_message(phone, body, channel)


def send_appointment_notification(clinic_id: str, appointment: dict, kind: str) -> dict[str, Any]:
    patient_id = appointment['patient_id']
    patient = database.get_patient(clinic_id, patient_id)
    if not patient:
        return {'status': 'FAILED', 'reason': 'Patient not found'}
    phone = _patient_phone(patient)
    channel = _patient_delivery_channel(patient)
    if not phone or not channel:
        return {'status': 'SKIPPED', 'reason': 'Patient has no supported phone contact method or has opted out'}

    try:
        dt = datetime.strptime(f"{appointment['date']} {appointment['time']}", "%Y-%m-%d %H:%M")
        fmt_date = dt.strftime("%b %d %Y").replace("Sep", "Sept")
        fmt_time = dt.strftime("%I:%M %p")
    except (ValueError, KeyError):
        fmt_date = appointment.get('date', '')
        fmt_time = appointment.get('time', '')

    if kind == 'confirmation':
        claim = 'confirmation'
        text = f"CareForMe: Your appointment is confirmed for {fmt_date} at {fmt_time}. Reply 1 to confirm or 2 to reschedule. Reply STOP to opt out."
    elif kind == 'reminder_24h':
        claim = 'reminder_24h'
        text = f"CareForMe reminder: You have an appointment tomorrow at {fmt_time} on {fmt_date}. Reply 1 to confirm or 2 to reschedule."
    elif kind == 'reminder_2h':
        claim = 'reminder_2h'
        text = f"CareForMe reminder: Your appointment is in about 2 hours at {fmt_time}. Reply 1 to confirm or 2 to reschedule."
    elif kind == 'reminder_10m':
        claim = 'reminder_10m'
        text = f"CareForMe reminder: Your appointment is starting in 10 minutes at {fmt_time}! See you soon."
    else:
        return {'status': 'FAILED', 'reason': f'Unknown notification kind: {kind}'}

    if not database.claim_appointment_notification(clinic_id, appointment['id'], claim):
        return {'status': 'ALREADY_SENT', 'kind': kind}

    result = messaging.send_patient_message(phone, text, channel)
    database.record_agent_action(
        clinic_id,
        appointment['id'],
        'send_patient_message',
        f'{kind} via {channel} for appointment {appointment["id"]}: {result.get("status")}',
        'COMPLETED' if result.get('status') in {'SENT', 'DRY_RUN'} else 'FAILED',
    )
    return result


def send_due_appointment_reminders(clinic_id: str, now: datetime | None = None) -> dict[str, int]:
    timezone = ZoneInfo(os.getenv('CLINIC_TIMEZONE', 'UTC'))
    current = now or datetime.now(timezone)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone)

    sent = 0
    skipped = 0
    for appointment in database.list_appointments(clinic_id):
        if appointment.get('status') not in {'SCHEDULED', 'RESCHEDULED'}:
            continue
        try:
            appointment_at = datetime.fromisoformat(
                f"{appointment['date']}T{appointment['time']}"
            ).replace(tzinfo=timezone)
        except (KeyError, TypeError, ValueError):
            skipped += 1
            continue
        if appointment_at <= current:
            continue

        kind = None
        if appointment_at - current <= timedelta(minutes=10):
            kind = 'reminder_10m'
        elif appointment_at - current <= timedelta(hours=2):
            kind = 'reminder_2h'
        elif appointment_at - current <= timedelta(hours=24):
            kind = 'reminder_24h'
        if kind:
            result = send_appointment_notification(clinic_id, appointment, kind)
            if result.get('status') in {'SENT', 'DRY_RUN'}:
                sent += 1
            else:
                skipped += 1
    return {'sent': sent, 'skipped': skipped}

def send_raw_sms(to_phone: str, message: str):
    """Send an SMS directly to a phone number (e.g. a doctor)."""
    if not TWILIO_CLIENT:
        print(f"Mock SMS to {to_phone}: {message}")
        return
    try:
        TWILIO_CLIENT.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_phone
        )
    except Exception as e:
        print(f"Error sending SMS to {to_phone}: {e}")

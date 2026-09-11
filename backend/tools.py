from uuid import uuid4

from strands import tool

import database
import notifications


def _record(clinic_id: str, tool_name: str, action: str, status: str):
    return database.record_agent_action(
        clinic_id=clinic_id,
        event_id=str(uuid4()),
        tool=tool_name,
        action=action,
        status=status,
    )


@tool
def get_patient_info(clinic_id: str, patient_name: str) -> dict:
    """Retrieve a clinic-scoped patient's administrative record by full name."""
    patient = database.get_patient_by_name(clinic_id, patient_name)
    status = "COMPLETED" if patient else "NOT_FOUND"
    _record(clinic_id, "get_patient_info", f"Retrieved patient {patient_name}", status)
    return patient or {"error": f"Patient '{patient_name}' not found."}

@tool
def create_patient_record(
    clinic_id: str,
    name: str,
    phone: str,
    email: str = "",
    preferred_contact_method: str = "SMS",
) -> dict:
    """Create a new patient record for the clinic."""
    patient = database.create_patient(
        clinic_id=clinic_id,
        name=name,
        email=email or None,
        phone=phone or None,
        preferred_contact_method=preferred_contact_method
    )
    _record(clinic_id, "create_patient", f"Created patient {name}", "COMPLETED")
    return patient

@tool
def create_doctor_record(
    clinic_id: str,
    name: str,
    phone: str,
) -> dict:
    """Create a new doctor record for the clinic."""
    doctor = database.create_doctor(
        clinic_id=clinic_id,
        name=name,
        phone=phone
    )
    _record(clinic_id, "create_doctor", f"Created doctor {name}", "COMPLETED")
    return doctor


@tool
def get_pending_escalations(clinic_id: str) -> dict:
    """Count and summarize escalation tasks still waiting for clinic staff review."""
    escalations = database.list_pending_escalations(clinic_id)
    _record(
        clinic_id,
        "get_pending_escalations",
        f"Counted {len(escalations)} unattended escalations",
        "COMPLETED",
    )
    return {
        "count": len(escalations),
        "escalations": [
            {
                "id": task.get("id"),
                "patient_id": task.get("patient_id"),
                "reason": task.get("reason"),
                "created_at": task.get("created_at"),
            }
            for task in escalations
        ],
    }


@tool
def get_available_slots(clinic_id: str, doctor_name: str, date: str) -> list[str]:
    """Find available routine appointment slots for a doctor on a date."""
    available = _find_available_slots(clinic_id, doctor_name, date)
    _record(clinic_id, "get_available_slots", f"Checked {doctor_name} on {date}", "COMPLETED")
    return available


def _find_available_slots(clinic_id: str, doctor_name: str, date: str) -> list[str]:
    doctor = database.get_doctor_by_name(clinic_id, doctor_name)
    doctor_id = doctor.get("id") if doctor else doctor_name
    
    booked = {
        appointment.get("time")
        for appointment in database.list_appointments(clinic_id)
        if appointment.get("doctor_id") in (doctor_id, doctor_name)
        and appointment.get("date") == date
        and appointment.get("status") != "CANCELLED"
    }
    slots = [f"{h:02d}:00" for h in range(9, 19)] + [f"{h:02d}:30" for h in range(9, 19)] + ["18:15", "18:45"]
    slots.sort()
    return [slot for slot in slots if slot not in booked]


@tool
def book_appointment(
    clinic_id: str,
    patient_id: str,
    doctor_name: str,
    date: str,
    time: str,
    duration: int = 30,
) -> dict:
    """Book a routine appointment after confirming the patient belongs to the clinic."""
    if not database.get_patient(clinic_id, patient_id):
        _record(clinic_id, "book_appointment", f"Patient {patient_id} was not found", "FAILED")
        return {"error": "Patient not found for this clinic."}

    doctor = database.get_doctor_by_name(clinic_id, doctor_name)
    if not doctor:
        _record(clinic_id, "book_appointment", f"Doctor {doctor_name} was not found", "FAILED")
        return {"error": "Doctor not found for this clinic."}
        
    doctor_id = doctor.get("id")

    booked = {a.get("time") for a in database.list_appointments(clinic_id) if a.get("doctor_id") in (doctor_id, doctor_name) and a.get("date") == date and a.get("status") != "CANCELLED"}
    if time in booked:
        _record(clinic_id, "book_appointment", f"Slot {date} {time} is double-booked", "FAILED")
        return {"error": "That exact time is already booked by another patient."}

    appointment = database.create_appointment(
        clinic_id, patient_id, doctor_id, date, time, duration
    )
    notifications.send_appointment_notification(clinic_id, appointment, "confirmation")
    _record(clinic_id, "book_appointment", f"Booked {date} {time} for {patient_id}", "COMPLETED")
    return {"message": "Appointment booked successfully", "appointment": appointment}


@tool
def reschedule_appointment(
    clinic_id: str, appointment_id: str, new_date: str, new_time: str
) -> dict:
    """Reschedule an existing administrative appointment and verify the saved result."""
    appointment = database.get_appointment(clinic_id, appointment_id)
    if not appointment:
        _record(clinic_id, "reschedule_appointment", f"Appointment {appointment_id} was not found", "FAILED")
        return {"error": "Appointment not found for this clinic."}

    updated = database.reschedule_appointment(clinic_id, appointment_id, new_date, new_time)
    
    patient_id = updated.get("patient_id")
    if patient_id:
        for t in database.list_tasks(clinic_id):
            if t.get("patient_id") == patient_id and t.get("type") == "RESCHEDULE_REQUESTED" and t.get("status") != "RESOLVED":
                database.resolve_task(clinic_id, t.get("id"))

    status = "COMPLETED" if updated and updated.get("date") == new_date and updated.get("time") == new_time else "FAILED"
    _record(clinic_id, "reschedule_appointment", f"Moved {appointment_id} to {new_date} {new_time}", status)
    return {"message": "Appointment rescheduled successfully", "appointment": updated}


@tool
def send_patient_message(clinic_id: str, patient_id: str, message: str) -> str:
    """Send a routine administrative SMS when the patient has opted into SMS."""
    result = notifications.send_patient_sms(clinic_id, patient_id, message)
    if result.get("status") == "FAILED":
        _record(clinic_id, "send_patient_message", f"Patient {patient_id} was not found", "FAILED")
        return result.get("reason", "Message could not be sent.")
    status = result.get("status")
    _record(clinic_id, "send_patient_message", f"SMS for {patient_id}: {status}", status)
    if status == "SKIPPED":
        return "Patient is not configured for SMS delivery."
    return "Message successfully queued for SMS delivery."


@tool
def create_followup_task(clinic_id: str, patient_id: str, task_type: str) -> str:
    """Create a pending administrative follow-up task for a clinic patient."""
    task = database.create_task(clinic_id, patient_id, task_type)
    notifications.send_patient_sms(
        clinic_id,
        patient_id,
        f"CareForMe reminder: your clinic has a follow-up task for you. Reply to this message or contact your clinic for help.",
    )
    _record(clinic_id, "create_followup_task", f"Created {task_type} for {patient_id}", "COMPLETED")
    return f"Follow-up task created with ID: {task['id']}"


@tool
def escalate_task(clinic_id: str, patient_id: str, reason: str) -> str:
    """Escalate clinical, safety, policy, or exceptional cases to clinic staff."""
    escalation = database.escalate_to_staff(clinic_id, patient_id, reason)
    _record(clinic_id, "escalate_task", f"Escalated {patient_id}: {reason}", "REQUIRES_HUMAN_REVIEW")
    return f"CLINICAL REVIEW REQUIRED. Case escalated. ID: {escalation['id']}"



@tool
def check_past_appointments(clinic_id: str) -> dict:
    """Find scheduled appointments that have already passed so the agent can follow up on them."""
    import os
    from datetime import datetime
    from zoneinfo import ZoneInfo
    
    timezone = ZoneInfo(os.getenv('CLINIC_TIMEZONE', 'UTC'))
    current = datetime.now(timezone)
    
    missed = []
    for appt in database.list_appointments(clinic_id):
        if appt.get("status") not in {"SCHEDULED", "CONFIRMED"}:
            continue
        try:
            appt_time = datetime.fromisoformat(f"{appt['date']}T{appt['time']}").replace(tzinfo=timezone)
        except Exception:
            continue
            
        if appt_time < current:
            missed.append({
                "id": appt.get("id"),
                "patient_id": appt.get("patient_id"),
                "date": appt.get("date"),
                "time": appt.get("time"),
            })
            
    _record(clinic_id, "check_past_appointments", f"Found {len(missed)} unattended past appointments", "COMPLETED")
    return {"missed_appointments": missed}

@tool
def mark_appointment_status(clinic_id: str, appointment_id: str, status: str) -> dict:
    """Update an appointment's status (e.g. COMPLETED, CANCELLED, NO_SHOW)."""
    database.update_appointment_status(clinic_id, appointment_id, status)
    _record(clinic_id, "mark_appointment_status", f"Marked {appointment_id} as {status}", "COMPLETED")
    return {"message": f"Appointment successfully marked as {status}."}
ALL_TOOLS = [
    get_patient_info,
    create_patient_record,
    create_doctor_record,
    get_pending_escalations,
    get_available_slots,
    book_appointment,
    reschedule_appointment,
    send_patient_message,
    create_followup_task,
    escalate_task,
    check_past_appointments,
    mark_appointment_status,
]

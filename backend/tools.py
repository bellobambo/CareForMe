from strands import tool
import database

@tool
def get_patient_info(patient_name: str) -> dict:
    """
    Retrieve basic patient information and status by their full name.
    """
    patient = database.get_patient_by_name(patient_name)
    if not patient:
        return {"error": f"Patient '{patient_name}' not found."}
    return patient

@tool
def get_available_slots(doctor_name: str, date: str) -> list[str]:
    """
    Find available appointment slots for a specific doctor on a given date.
    Args:
        doctor_name (str): e.g., 'Dr. Ade'
        date (str): e.g., '2026-09-10' or 'tomorrow'
    """
    # Mock availability logic for MVP
    return ["09:00 AM", "11:30 AM", "02:00 PM", "03:30 PM"]

@tool
def book_appointment(patient_id: str, doctor_name: str, date: str, time: str) -> dict:
    """
    Book an appointment for a patient.
    """
    appt = database.create_appointment(patient_id, doctor_name, date, time)
    return {"message": "Appointment booked successfully", "appointment": appt}

@tool
def reschedule_appointment(appointment_id: str, new_date: str, new_time: str) -> dict:
    """
    Reschedule an existing appointment.
    """
    database.update_appointment_status(appointment_id, "RESCHEDULED")
    # For MVP, we just update status. In a real app we'd create a new one or update times.
    return {"message": f"Appointment {appointment_id} rescheduled to {new_date} at {new_time}"}

@tool
def send_patient_message(patient_id: str, message: str) -> str:
    """
    Send an SMS or Email to the patient (Simulated).
    """
    print(f"--- SIMULATED MESSAGE TO PATIENT {patient_id} ---")
    print(message)
    print("-------------------------------------------------")
    return "Message successfully queued for delivery."

@tool
def create_followup_task(patient_id: str, task_type: str) -> str:
    """
    Create a background follow-up task for a patient (e.g. 'check_lab_results').
    """
    task = database.create_task(patient_id, task_type)
    return f"Follow-up task created with ID: {task['id']}"

@tool
def escalate_task(patient_id: str, reason: str) -> str:
    """
    Escalate a case to human clinic staff when it exceeds administrative authority (e.g., clinical questions).
    """
    esc = database.escalate_to_staff(patient_id, reason)
    return f"⚠ CLINICAL REVIEW REQUIRED. Case escalated. ID: {esc['id']}"

# Export all tools for the agent
ALL_TOOLS = [
    get_patient_info,
    get_available_slots,
    book_appointment,
    reschedule_appointment,
    send_patient_message,
    create_followup_task,
    escalate_task
]

from contextlib import asynccontextmanager
import os
import re
from typing import Literal, Optional
from urllib.parse import parse_qs

from fastapi import FastAPI, BackgroundTasks, Depends, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import careforme_agent
import database
import notifications
from auth import get_current_clinic_id

@asynccontextmanager
async def lifespan(_app: FastAPI):
    database.init_db()
    yield


app = FastAPI(title="CareForMe API", lifespan=lifespan)

def extract_agent_text(message) -> str:
    """Return only assistant text from a Strands AgentResult message."""
    if isinstance(message, str):
        text = message
    elif isinstance(message, dict):
        content = message.get("content", [])
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            text = "\n".join(
                item.get("text", "")
                for item in content
                if isinstance(item, dict) and item.get("text")
            )
        else:
            text = str(message)
    else:
        content = getattr(message, "content", [])
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            text = "\n".join(
                item.get("text", "")
                for item in content
                if isinstance(item, dict) and item.get("text")
            )
        else:
            text = str(message)

    text = re.sub(r"<thinking>[\s\S]*?(</thinking>|$)", "", text, flags=re.IGNORECASE)
    response_match = re.search(r"<response>([\s\S]*?)(</response>|$)", text, flags=re.IGNORECASE)
    if response_match:
        text = response_match.group(1)
    return re.sub(r"</?(thinking|response)>", "", text, flags=re.IGNORECASE).strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class EventRequest(BaseModel):
    clinic_id: str
    event_type: str
    patient_id: str
    details: dict = {}

class ClinicRegisterRequest(BaseModel):
    name: str
    admin_email: str
    location: str = None

class PatientRegisterRequest(BaseModel):
    name: str
    email: str = None
    phone: str = None
    preferred_contact_method: str = "EMAIL"

class AppointmentCreateRequest(BaseModel):
    patient_id: str
    doctor_id: str
    date: str
    time: str
    duration: int = 30
    type: str = "new visit"
    reason: Optional[str] = None
    color: Optional[str] = "#39a9e9"

class AppointmentRescheduleRequest(BaseModel):
    date: str
    time: str
    color: Optional[str] = None

class AppointmentStatusUpdateRequest(BaseModel):
    status: Literal["SCHEDULED", "CONFIRMED", "COMPLETED", "RESCHEDULED", "NO_SHOW", "CANCELLED"]

class ReminderRunRequest(BaseModel):
    clinic_id: str

@app.get("/")
def read_root():
    return {"message": "Welcome to CareForMe API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- Registration Endpoints ---

@app.post("/api/clinics/register")
def register_clinic(request: ClinicRegisterRequest):
    """
    Registers a new clinic in DynamoDB. Called by the frontend after Cognito signUp succeeds.
    """
    try:
        clinic = database.register_clinic(request.name, request.admin_email, request.location)
        return {"message": "Clinic registered successfully", "clinic": clinic}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/patients")
def connect_patient(request: PatientRegisterRequest, clinic_id: str = Depends(get_current_clinic_id)):
    """
    Connects/Registers a new patient to the authenticated clinic.
    """
    patient = database.create_patient(
        clinic_id,
        request.name,
        request.email,
        request.phone,
        request.preferred_contact_method,
    )
    return {"message": "Patient connected successfully", "patient": patient}

@app.get("/api/clinics/me")
def get_my_clinic(clinic_id: str = Depends(get_current_clinic_id)):
    """
    Returns the details of the currently authenticated clinic.
    """
    clinic = database.get_clinic(clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinic

# --- Data Fetching Endpoints for Next.js Dashboard ---

@app.get("/api/patients")
def get_all_patients(clinic_id: str = Depends(get_current_clinic_id)):
    return database.list_patients(clinic_id)

@app.get("/api/appointments")
def get_all_appointments(clinic_id: str = Depends(get_current_clinic_id)):
    return database.list_appointments(clinic_id)

@app.post("/api/appointments")
def schedule_appointment(
    request: AppointmentCreateRequest,
    background_tasks: BackgroundTasks,
    clinic_id: str = Depends(get_current_clinic_id),
):
    if not database.get_patient(clinic_id, request.patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    if request.duration <= 0:
        raise HTTPException(status_code=400, detail="Duration must be greater than zero")

    appointment = database.create_appointment(
        clinic_id,
        request.patient_id,
        request.doctor_id,
        request.date,
        request.time,
        request.duration,
        request.type,
        request.reason,
        request.color,
    )
    background_tasks.add_task(
        notifications.send_appointment_notification, clinic_id, appointment, "confirmation"
    )
    return {"message": "Appointment scheduled successfully", "appointment": appointment}

@app.put("/api/appointments/{appointment_id}")
def reschedule_appointment(
    appointment_id: str,
    request: AppointmentRescheduleRequest,
    background_tasks: BackgroundTasks,
    clinic_id: str = Depends(get_current_clinic_id),
):
    if not database.get_appointment(clinic_id, appointment_id):
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment = database.reschedule_appointment(
        clinic_id, appointment_id, request.date, request.time, request.color
    )
    
    # Auto-resolve any pending reschedule tasks for this patient
    patient_id = appointment.get("patient_id")
    if patient_id:
        for t in database.list_tasks(clinic_id):
            if t.get("patient_id") == patient_id and t.get("type") == "RESCHEDULE_REQUESTED" and t.get("status") != "RESOLVED":
                database.resolve_task(clinic_id, t.get("id"))
                
    background_tasks.add_task(
        notifications.send_appointment_notification, clinic_id, appointment, "confirmation"
    )
    return {"message": "Appointment rescheduled successfully", "appointment": appointment}

@app.patch("/api/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: str,
    request: AppointmentStatusUpdateRequest,
    clinic_id: str = Depends(get_current_clinic_id),
):
    if not database.get_appointment(clinic_id, appointment_id):
        raise HTTPException(status_code=404, detail="Appointment not found")
    database.update_appointment_status(clinic_id, appointment_id, request.status)
    return {"message": "Appointment status updated", "appointment": database.get_appointment(clinic_id, appointment_id)}


class DoctorCreateRequest(BaseModel):
    name: str
    phone: str

@app.get("/api/doctors")
def get_doctors(clinic_id: str = Depends(get_current_clinic_id)):
    return database.list_doctors(clinic_id)

@app.post("/api/doctors")
def create_doctor(request: DoctorCreateRequest, clinic_id: str = Depends(get_current_clinic_id)):
    return database.create_doctor(clinic_id, request.name, request.phone)

@app.get("/api/tasks")

def get_all_tasks(clinic_id: str = Depends(get_current_clinic_id)):
    return database.list_tasks(clinic_id)

@app.put("/api/tasks/{task_id}/resolve")
def resolve_task(task_id: str, clinic_id: str = Depends(get_current_clinic_id)):
    """Mark a clinic-scoped follow-up or escalation task as resolved by staff."""
    task = next(
        (item for item in database.list_tasks(clinic_id) if item.get("id") == task_id),
        None,
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    resolved_task = database.resolve_task(clinic_id, task_id)
    return {"message": "Task resolved successfully", "task": resolved_task}

@app.get("/api/agent-actions")
def get_agent_actions(clinic_id: str = Depends(get_current_clinic_id)):
    return database.list_agent_actions(clinic_id)

@app.get("/api/stats")
def get_dashboard_stats(clinic_id: str = Depends(get_current_clinic_id)):
    tasks = database.list_tasks(clinic_id)
    appts = database.list_appointments(clinic_id)

    escalations = len([t for t in tasks if t.get('type') == 'ESCALATION' and t.get('status') == 'REQUIRES_HUMAN_REVIEW'])
    task_followups = len([t for t in tasks if t.get('type') != 'ESCALATION' and t.get('status') == 'PENDING'])
    appt_followups = len([a for a in appts if str(a.get('type', '')).lower() == 'follow-up'])
    pending_followups = task_followups + appt_followups

    return {
        "follow_ups": pending_followups,
        "appointments": len(appts),
        "escalations": escalations
    }

# --- Agent and Event Endpoints ---

@app.post("/api/chat")
def chat_with_agent(request: ChatRequest, clinic_id: str = Depends(get_current_clinic_id)):
    """
    Send a message to the CareForMe autonomous agent for a specific clinic.
    """
    try:
        prompt = f"System Instruction: You are operating on behalf of clinic_id '{clinic_id}'. You MUST use this exact clinic_id for ALL tool calls. Do not ask the user for it.\n\nUser Message: {request.message}"
        result = careforme_agent(prompt)
        return {"response": extract_agent_text(result.message)}
    except Exception as e:
        return {"error": str(e)}

def process_event_background(event: EventRequest):
    """
    The Autonomous Loop. Triggered by EventBridge with clinic_id injected.
    """
    print(f"--- [EVENT RECEIVED] {event.event_type} for Patient {event.patient_id} (Clinic: {event.clinic_id}) ---")

    if event.event_type == "FOLLOWUP_DUE":
        prompt = f"[Context: Clinic {event.clinic_id}] Patient {event.patient_id} is due for a follow-up. Please check their records, find available slots if needed, and send them a message."
    elif event.event_type == "APPOINTMENT_MISSED":
        notifications.send_patient_sms(
            event.clinic_id,
            event.patient_id,
            "CareForMe: We missed you at your appointment today. Reply 2 to request a new time, or contact your clinic.",
        )
        prompt = f"[Context: Clinic {event.clinic_id}] Patient {event.patient_id} missed their appointment today. Please review their history and reach out to reschedule."
    else:
        prompt = f"[Context: Clinic {event.clinic_id}] System Event: {event.event_type} for patient {event.patient_id}. Handle according to clinic policy."

    try:
        careforme_agent(prompt)
        print(f"--- [AGENT LOOP COMPLETE] Task handled successfully ---")
    except Exception as e:
        print(f"--- [AGENT ERROR] Failed to process event: {e} ---")

@app.post("/api/events")
def receive_event(event: EventRequest, background_tasks: BackgroundTasks):
    """
    Webhook for Amazon EventBridge.
    """
    background_tasks.add_task(process_event_background, event)
    return {"status": "Event received and queued for processing"}

@app.post("/api/reminders/run")
def run_reminders(request: ReminderRunRequest, x_reminder_token: str = Header(default="")):
    """Cron-friendly endpoint for the 24-hour and 2-hour reminder worker."""
    expected_token = os.getenv("REMINDER_RUN_TOKEN")
    if not expected_token or x_reminder_token != expected_token:
        raise HTTPException(status_code=403, detail="Invalid reminder worker token")
    return notifications.send_due_appointment_reminders(request.clinic_id)

@app.api_route("/api/twilio/inbound", methods=["GET", "POST"])
@app.api_route("/api/twilio/inbound/", methods=["GET", "POST"])
async def twilio_inbound(request: Request):
    """Handle opt-out, confirmation, reschedule, and cancellation replies from patients."""
    if request.method == "POST":
        form = parse_qs((await request.body()).decode("utf-8"))
    else:
        form = parse_qs(request.url.query)
    sender = form.get("From", [""])[0]
    body = form.get("Body", [""])[0].strip().upper()
    patients = database.find_patients_by_phone(sender)
    reply = "We could not match this number. Please contact your clinic directly."

    if patients:
        if body in {"STOP", "UNSUBSCRIBE", "END", "QUIT"}:
            for patient in patients:
                database.update_patient_contact_preference(patient["clinic_id"], patient["id"], "NONE")
            reply = "You are unsubscribed from CareForMe texts. Contact your clinic to opt back in."
        else:
            from datetime import datetime
            now_str = datetime.now().strftime("%Y-%m-%dT%H:%M")
            upcoming = []
            for patient in patients:
                upcoming.extend([
                    appointment for appointment in database.get_patient_appointments(patient["clinic_id"], patient["id"])
                    if appointment.get("status") in {"SCHEDULED", "RESCHEDULED"} and f"{appointment.get('date', '')}T{appointment.get('time', '')}" >= now_str
                ])
            upcoming.sort(key=lambda item: f"{item.get('date', '')}T{item.get('time', '')}")
            
            if body in {"1", "YES", "CONFIRM", "CONFIRMED"} and upcoming:
                database.update_appointment_status(upcoming[0]["clinic_id"], upcoming[0]["id"], "CONFIRMED")
                reply = "Thanks, your appointment is confirmed."
            elif body in {"2", "NO", "RESCHEDULE"}:
                # If they want to reschedule, but there are no upcoming appointments, we can still create a task for the first patient matched
                # But it's better to associate it with the upcoming appointment if there is one.
                if upcoming:
                    database.create_task(upcoming[0]["clinic_id"], upcoming[0]["patient_id"], "RESCHEDULE_REQUESTED")
                else:
                    database.create_task(patients[0]["clinic_id"], patients[0]["id"], "RESCHEDULE_REQUESTED")
                reply = "We notified your clinic that you would like to reschedule."
            elif body in {"3", "CANCEL", "CANCEL APPOINTMENT"} and upcoming:
                database.update_appointment_status(upcoming[0]["clinic_id"], upcoming[0]["id"], "CANCELLED")
                reply = "Your upcoming appointment has been cancelled. Contact your clinic if you would like to book another time."
            else:
                reply = "Reply 1 to confirm, 2 to reschedule, 3 to cancel, or STOP to opt out."

    escaped = reply.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Response(
        content=f"<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>{escaped}</Message></Response>",
        media_type="text/xml",
    )

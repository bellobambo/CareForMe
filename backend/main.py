from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from agent import careforme_agent
import database

app = FastAPI(title="CareForMe API")

class ChatRequest(BaseModel):
    message: str

class EventRequest(BaseModel):
    event_type: str
    patient_id: str
    details: dict = {}

@app.get("/")
def read_root():
    return {"message": "Welcome to CareForMe API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- Data Fetching Endpoints for Next.js Dashboard ---

@app.get("/api/patients")
def get_all_patients():
    table = database.get_table('Patients')
    return table.scan().get('Items', [])

@app.get("/api/appointments")
def get_all_appointments():
    table = database.get_table('Appointments')
    return table.scan().get('Items', [])

@app.get("/api/tasks")
def get_all_tasks():
    table = database.get_table('Tasks')
    return table.scan().get('Items', [])

@app.get("/api/stats")
def get_dashboard_stats():
    # Helper to calculate stats for the main dashboard page
    tasks = database.get_table('Tasks').scan().get('Items', [])
    appts = database.get_table('Appointments').scan().get('Items', [])
    
    escalations = len([t for t in tasks if t.get('type') == 'ESCALATION'])
    pending_followups = len([t for t in tasks if t.get('type') != 'ESCALATION' and t.get('status') == 'PENDING'])
    
    return {
        "follow_ups": pending_followups,
        "appointments": len(appts),
        "escalations": escalations
    }

# --- Agent and Event Endpoints ---


@app.post("/api/chat")
def chat_with_agent(request: ChatRequest):
    """
    Send a message to the CareForMe autonomous agent.
    """
    try:
        # Invoke the Strands agent
        result = careforme_agent(request.message)
        
        # Strands agent returns an AgentResult object.
        # result.message contains the final text response.
        return {"response": str(result.message)}
    except Exception as e:
        return {"error": str(e)}

def process_event_background(event: EventRequest):
    """
    The Autonomous Loop (Phase 5). This runs in the background triggered by EventBridge (Phase 4).
    """
    print(f"--- [EVENT RECEIVED] {event.event_type} for Patient {event.patient_id} ---")
    
    # Formulate a prompt to wake up the agent based on the event
    if event.event_type == "FOLLOWUP_DUE":
        prompt = f"Patient {event.patient_id} is due for a follow-up. Please check their records, find available slots if needed, and send them a message."
    elif event.event_type == "APPOINTMENT_MISSED":
        prompt = f"Patient {event.patient_id} missed their appointment today. Please review their history and reach out to reschedule."
    else:
        prompt = f"System Event: {event.event_type} for patient {event.patient_id}. Handle according to clinic policy."
        
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

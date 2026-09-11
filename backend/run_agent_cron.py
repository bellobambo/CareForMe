import os
import sys

from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.join(os.path.dirname(__file__)))

import database
import requests
from agent import careforme_agent

# Get all clinics
clinics = database.get_table('Clinics').scan().get('Items', [])

token = os.getenv("REMINDER_RUN_TOKEN", "careforme_secure_token_123")

for clinic in clinics:
    clinic_id = clinic['clinic_id']
    print(f"\nProcessing clinic: {clinic['name']} ({clinic_id})")
    
    # Standard reminders
    try:
        import notifications
        res = notifications.send_due_appointment_reminders(clinic_id)
        print(f"Triggered standard reminders. Sent: {res.get('sent', 0)}, Skipped: {res.get('skipped', 0)}")
    except Exception as e:
        print("Could not process standard reminders:", e)

    # Strands agent background maintenance
    print("Waking up AI Agent for background maintenance...")
    response = careforme_agent(
        f"Hello CareForMe. Please perform routine background maintenance for clinic '{clinic_id}'. Check for past appointments, follow up with patients via SMS if needed, and update their statuses."
    )
    print("Agent completed maintenance:")
    print(response)


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
        requests.post(
            "http://127.0.0.1:8000/api/reminders/run",
            json={"clinic_id": clinic_id},
            headers={"x-reminder-token": token}
        )
        print("Triggered standard reminders.")
    except Exception as e:
        print("Could not reach API for standard reminders:", e)

    # Strands agent background maintenance
    print("Waking up AI Agent for background maintenance...")
    response = careforme_agent(
        f"Hello CareForMe. Please perform routine background maintenance for clinic '{clinic_id}'. Check for past appointments, follow up with patients via SMS if needed, and update their statuses."
    )
    print("Agent completed maintenance:")
    print(response)


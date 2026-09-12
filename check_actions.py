import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
import database

print("--- LATEST TASKS ---")
tasks = database.get_table('Tasks').scan().get('Items', [])
tasks.sort(key=lambda x: x.get('created_at', ''), reverse=True)
for t in tasks[:2]:
    print(t)

print("\n--- LATEST ACTIONS ---")
actions = database.get_table('AgentActions').scan().get('Items', [])
actions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
for a in actions[:2]:
    print(a)

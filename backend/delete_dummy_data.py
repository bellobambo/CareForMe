import os
from dotenv import load_dotenv
load_dotenv()
import boto3

dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))

def scan_all(table):
    response = table.scan()
    items = response.get('Items', [])
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response.get('Items', []))
    return items

def delete_dummy():
    patients_table = dynamodb.Table('CareForMe_Patients')
    appointments_table = dynamodb.Table('CareForMe_Appointments')
    doctors_table = dynamodb.Table('CareForMe_Doctors')
    actions_table = dynamodb.Table('CareForMe_AgentActions')
    
    # 1. Delete appointments for 2026-01-05
    appts = scan_all(appointments_table)
    for a in appts:
        if a.get('date') == '2026-01-05':
            appointments_table.delete_item(Key={'id': a['id']})
            print(f"Deleted appointment {a['id']}")
            
    # 2. Delete John Doe
    patients = scan_all(patients_table)
    for p in patients:
        if p.get('name') == 'John Doe' and p.get('id') != 'p-102': # Keep the seed one
            patients_table.delete_item(Key={'id': p['id']})
            print(f"Deleted patient {p['id']}")
            
    # 3. Delete Mr Bee
    doctors = scan_all(doctors_table)
    for d in doctors:
        if d.get('name') == 'Mr Bee':
            doctors_table.delete_item(Key={'clinic_id': d['clinic_id'], 'id': d['id']})
            print(f"Deleted doctor {d['id']}")
            
    # 4. Clean up agent actions
    actions = scan_all(actions_table)
    for act in actions:
        if act.get('timestamp', '').startswith('2026-09-11T17:'):
            actions_table.delete_item(Key={'clinic_id': act['clinic_id'], 'id': act['id']})

delete_dummy()

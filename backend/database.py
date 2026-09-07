import os
import boto3
from botocore.exceptions import ClientError
from uuid import uuid4
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))

TABLE_PREFIX = "CareForMe_"

def create_table_if_not_exists(table_name, key_schema, attribute_definitions):
    full_table_name = f"{TABLE_PREFIX}{table_name}"
    try:
        table = dynamodb.create_table(
            TableName=full_table_name,
            KeySchema=key_schema,
            AttributeDefinitions=attribute_definitions,
            BillingMode='PAY_PER_REQUEST'
        )
        table.meta.client.get_waiter('table_exists').wait(TableName=full_table_name)
        print(f"Created table {full_table_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"Table {full_table_name} already exists.")
        else:
            raise e
    return dynamodb.Table(full_table_name)

def init_db():
    print("Initializing DynamoDB tables...")
    create_table_if_not_exists(
        'Patients',
        [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        [{'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    create_table_if_not_exists(
        'Appointments',
        [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        [{'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    create_table_if_not_exists(
        'Tasks',
        [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        [{'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    print("Database initialization complete.")

def get_table(name):
    return dynamodb.Table(f"{TABLE_PREFIX}{name}")

# --- CRUD Helpers ---

def get_patient(patient_id: str):
    table = get_table('Patients')
    response = table.get_item(Key={'id': patient_id})
    return response.get('Item')

def list_patients():
    table = get_table('Patients')
    return table.scan().get('Items', [])

def get_patient_by_name(name: str):
    # For MVP, scan is fine. In prod, use GSIs.
    patients = list_patients()
    for p in patients:
        if p.get('name', '').lower() == name.lower():
            return p
    return None

def create_appointment(patient_id: str, doctor_id: str, date: str, time: str):
    table = get_table('Appointments')
    appt_id = str(uuid4())
    item = {
        'id': appt_id,
        'patient_id': patient_id,
        'doctor_id': doctor_id,
        'date': date,
        'time': time,
        'status': 'SCHEDULED',
        'type': 'routine'
    }
    table.put_item(Item=item)
    return item

def get_patient_appointments(patient_id: str):
    table = get_table('Appointments')
    # Scan for MVP
    appts = table.scan().get('Items', [])
    return [a for a in appts if a.get('patient_id') == patient_id]

def update_appointment_status(appt_id: str, status: str):
    table = get_table('Appointments')
    table.update_item(
        Key={'id': appt_id},
        UpdateExpression="set #s = :s",
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': status}
    )

def create_task(patient_id: str, task_type: str, priority: str = "NORMAL"):
    table = get_table('Tasks')
    task_id = str(uuid4())
    item = {
        'id': task_id,
        'type': task_type,
        'patient_id': patient_id,
        'priority': priority,
        'status': 'PENDING',
        'created_at': datetime.now().isoformat()
    }
    table.put_item(Item=item)
    return item

def escalate_to_staff(patient_id: str, reason: str):
    table = get_table('Tasks')
    task_id = str(uuid4())
    item = {
        'id': task_id,
        'type': 'ESCALATION',
        'patient_id': patient_id,
        'reason': reason,
        'status': 'REQUIRES_HUMAN_REVIEW',
        'created_at': datetime.now().isoformat()
    }
    table.put_item(Item=item)
    return item

if __name__ == "__main__":
    # Test initialization
    init_db()

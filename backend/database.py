import os
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr, Key
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
        'Clinics',
        [{'AttributeName': 'clinic_id', 'KeyType': 'HASH'}],
        [{'AttributeName': 'clinic_id', 'AttributeType': 'S'}]
    )
    create_table_if_not_exists(
        'Patients',
        [{'AttributeName': 'clinic_id', 'KeyType': 'HASH'}, {'AttributeName': 'id', 'KeyType': 'RANGE'}],
        [{'AttributeName': 'clinic_id', 'AttributeType': 'S'}, {'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    create_table_if_not_exists(
        'Appointments',
        [{'AttributeName': 'clinic_id', 'KeyType': 'HASH'}, {'AttributeName': 'id', 'KeyType': 'RANGE'}],
        [{'AttributeName': 'clinic_id', 'AttributeType': 'S'}, {'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    create_table_if_not_exists(
        'Tasks',
        [{'AttributeName': 'clinic_id', 'KeyType': 'HASH'}, {'AttributeName': 'id', 'KeyType': 'RANGE'}],
        [{'AttributeName': 'clinic_id', 'AttributeType': 'S'}, {'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    create_table_if_not_exists(
        'AgentActions',
        [{'AttributeName': 'clinic_id', 'KeyType': 'HASH'}, {'AttributeName': 'id', 'KeyType': 'RANGE'}],
        [{'AttributeName': 'clinic_id', 'AttributeType': 'S'}, {'AttributeName': 'id', 'AttributeType': 'S'}]
    )
    print("Database initialization complete.")

def get_table(name):
    return dynamodb.Table(f"{TABLE_PREFIX}{name}")

def _appointment_key(table, clinic_id: str, appointment_id: str):
    key_names = {key['AttributeName'] for key in table.key_schema}
    if 'clinic_id' in key_names:
        return {'clinic_id': clinic_id, 'id': appointment_id}
    return {'id': appointment_id}

def _patient_key(table, clinic_id: str, patient_id: str):
    key_names = {key['AttributeName'] for key in table.key_schema}
    if 'clinic_id' in key_names:
        return {'clinic_id': clinic_id, 'id': patient_id}
    return {'id': patient_id}

# --- Clinic CRUD ---

def register_clinic(name: str, admin_email: str, location: str = None):
    table = get_table('Clinics')

    # Check if clinic email already exists
    clinics = table.scan().get('Items', [])
    for c in clinics:
        if c.get('admin_email', '').lower() == admin_email.lower():
            raise ValueError(f"A clinic with email '{admin_email}' is already registered.")

    clinic_id = str(uuid4())
    item = {
        'clinic_id': clinic_id,
        'name': name,
        'admin_email': admin_email,
        'location': location,
        'created_at': datetime.now().isoformat()
    }
    table.put_item(Item=item)
    return item

def get_clinic(clinic_id: str):
    table = get_table('Clinics')
    response = table.get_item(Key={'clinic_id': clinic_id})
    return response.get('Item')

def get_clinic_by_email(email: str):
    table = get_table('Clinics')
    clinics = table.scan().get('Items', [])
    for c in clinics:
        if c.get('admin_email', '').lower() == email.lower():
            return c
    return None

# --- Patient CRUD ---

def get_patient(clinic_id: str, patient_id: str):
    table = get_table('Patients')
    response = table.get_item(Key=_patient_key(table, clinic_id, patient_id))
    patient = response.get('Item')
    if patient and patient.get('clinic_id') != clinic_id:
        return None
    return patient

def list_patients(clinic_id: str):
    table = get_table('Patients')
    key_names = {key['AttributeName'] for key in table.key_schema}
    if 'clinic_id' in key_names:
        response = table.query(
            KeyConditionExpression=Key('clinic_id').eq(clinic_id)
        )
        return response.get('Items', [])

    # Older tables used id as the only key, so clinic scoping requires a scan.
    items = []
    scan_kwargs = {'FilterExpression': Attr('clinic_id').eq(clinic_id)}
    while True:
        response = table.scan(**scan_kwargs)
        items.extend(response.get('Items', []))
        last_key = response.get('LastEvaluatedKey')
        if not last_key:
            return items
        scan_kwargs['ExclusiveStartKey'] = last_key

def create_patient(
    clinic_id: str,
    name: str,
    email: str = None,
    phone: str = None,
    preferred_contact_method: str = "EMAIL",
):
    table = get_table('Patients')
    patient_id = str(uuid4())
    item = {
        'clinic_id': clinic_id,
        'id': patient_id,
        'name': name,
        'email': email,
        'phone': phone,
        'contact': phone or email,
        'preferred_contact_method': preferred_contact_method,
        'communication_preferences': {'email': email, 'phone': phone},
        'status': 'ACTIVE',
        'created_at': datetime.now().isoformat()
    }
    table.put_item(Item=item)
    return item

def get_patient_by_name(clinic_id: str, name: str):
    patients = list_patients(clinic_id)
    for p in patients:
        if p.get('name', '').lower() == name.lower():
            return p
    return None

def find_patient_by_phone(phone: str):
    """Find a patient for an inbound SMS after normalizing common phone formatting."""
    normalized = ''.join(character for character in phone if character.isdigit())
    table = get_table('Patients')
    response = table.scan()
    for patient in response.get('Items', []):
        patient_phone = patient.get('phone') or patient.get('contact') or ''
        candidate = ''.join(character for character in patient_phone if character.isdigit())
        if candidate and candidate[-10:] == normalized[-10:]:
            return patient
    return None

def update_patient_contact_preference(clinic_id: str, patient_id: str, preference: str):
    table = get_table('Patients')
    table.update_item(
        Key=_patient_key(table, clinic_id, patient_id),
        UpdateExpression='set preferred_contact_method = :preference',
        ExpressionAttributeValues={':preference': preference},
    )
    return get_patient(clinic_id, patient_id)

# --- Appointment CRUD ---

def get_appointment(clinic_id: str, appointment_id: str):
    table = get_table('Appointments')
    response = table.get_item(Key=_appointment_key(table, clinic_id, appointment_id))
    appointment = response.get('Item')
    if appointment and appointment.get('clinic_id') != clinic_id:
        return None
    return appointment

def create_appointment(
    clinic_id: str,
    patient_id: str,
    doctor_id: str,
    date: str,
    time: str,
    duration: int = 30,
    appointment_type: str = 'new visit',
    reason: str = None,
    color: str = "#39a9e9",
):
    table = get_table('Appointments')
    appt_id = str(uuid4())
    item = {
        'clinic_id': clinic_id,
        'id': appt_id,
        'patient_id': patient_id,
        'doctor_id': doctor_id,
        'date': date,
        'time': time,
        'duration': duration,
        'status': 'SCHEDULED',
        'type': appointment_type,
        'reason': reason,
        'color': color
    }
    table.put_item(Item=item)
    return item

def list_appointments(clinic_id: str):
    table = get_table('Appointments')
    key_names = {key['AttributeName'] for key in table.key_schema}
    if 'clinic_id' in key_names:
        response = table.query(
            KeyConditionExpression=Key('clinic_id').eq(clinic_id)
        )
        return response.get('Items', [])

    # Older tables used id as the only key, so clinic scoping requires a scan.
    items = []
    scan_kwargs = {'FilterExpression': Attr('clinic_id').eq(clinic_id)}
    while True:
        response = table.scan(**scan_kwargs)
        items.extend(response.get('Items', []))
        last_key = response.get('LastEvaluatedKey')
        if not last_key:
            return items
        scan_kwargs['ExclusiveStartKey'] = last_key

def get_patient_appointments(clinic_id: str, patient_id: str):
    appts = list_appointments(clinic_id)
    return [a for a in appts if a.get('patient_id') == patient_id]

def update_appointment_status(clinic_id: str, appt_id: str, status: str):
    table = get_table('Appointments')
    table.update_item(
        Key=_appointment_key(table, clinic_id, appt_id),
        UpdateExpression="set #s = :s",
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={':s': status}
    )

def reschedule_appointment(clinic_id: str, appt_id: str, date: str, time: str, color: str = None):
    table = get_table('Appointments')
    
    update_expr = "set #d = :d, #t = :t, #s = :s remove confirmation_sent_at, reminder_24h_sent_at, reminder_2h_sent_at"
    expr_names = {'#d': 'date', '#t': 'time', '#s': 'status'}
    expr_vals = {':d': date, ':t': time, ':s': 'RESCHEDULED'}
    
    if color:
        update_expr = update_expr.replace("set #d", "set #c = :c, #d")
        expr_names['#c'] = 'color'
        expr_vals[':c'] = color
        
    table.update_item(
        Key=_appointment_key(table, clinic_id, appt_id),
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_vals,
    )
    return get_appointment(clinic_id, appt_id)

def claim_appointment_notification(clinic_id: str, appt_id: str, notification: str) -> bool:
    """Atomically claim a notification slot so concurrent workers send only once."""
    table = get_table('Appointments')
    field = f'{notification}_sent_at'
    try:
        table.update_item(
            Key=_appointment_key(table, clinic_id, appt_id),
            UpdateExpression=f'set #{field} = :timestamp',
            ConditionExpression=f'attribute_not_exists(#{field})',
            ExpressionAttributeNames={f'#{field}': field},
            ExpressionAttributeValues={':timestamp': datetime.now().isoformat()},
        )
        return True
    except ClientError as error:
        if error.response.get('Error', {}).get('Code') == 'ConditionalCheckFailedException':
            return False
        raise

# --- Task CRUD ---

def list_tasks(clinic_id: str):
    table = get_table('Tasks')
    try:
        response = table.query(
            KeyConditionExpression=Key('clinic_id').eq(clinic_id)
        )
        return response.get('Items', [])
    except ClientError as error:
        if error.response.get('Error', {}).get('Code') != 'ValidationException':
            raise

        # Supports Tasks tables created before clinic_id became the partition key.
        items = []
        scan_kwargs = {'FilterExpression': Attr('clinic_id').eq(clinic_id)}
        while True:
            response = table.scan(**scan_kwargs)
            items.extend(response.get('Items', []))
            last_key = response.get('LastEvaluatedKey')
            if not last_key:
                break
            scan_kwargs['ExclusiveStartKey'] = last_key
        return items

def list_pending_escalations(clinic_id: str):
    """Read pending escalations without assuming a legacy Tasks key schema."""
    table = get_table('Tasks')
    items = []
    scan_kwargs = {
        'FilterExpression': (
            Attr('clinic_id').eq(clinic_id)
            & Attr('type').eq('ESCALATION')
            & Attr('status').eq('REQUIRES_HUMAN_REVIEW')
        )
    }

    while True:
        response = table.scan(**scan_kwargs)
        items.extend(response.get('Items', []))
        last_key = response.get('LastEvaluatedKey')
        if not last_key:
            break
        scan_kwargs['ExclusiveStartKey'] = last_key

    return items

def create_task(clinic_id: str, patient_id: str, task_type: str, priority: str = "NORMAL"):
    table = get_table('Tasks')
    task_id = str(uuid4())
    item = {
        'clinic_id': clinic_id,
        'id': task_id,
        'type': task_type,
        'patient_id': patient_id,
        'priority': priority,
        'status': 'PENDING',
        'created_at': datetime.now().isoformat()
    }
    table.put_item(Item=item)
    return item

def escalate_to_staff(clinic_id: str, patient_id: str, reason: str):
    table = get_table('Tasks')
    task_id = str(uuid4())
    item = {
        'clinic_id': clinic_id,
        'id': task_id,
        'type': 'ESCALATION',
        'patient_id': patient_id,
        'reason': reason,
        'status': 'REQUIRES_HUMAN_REVIEW',
        'created_at': datetime.now().isoformat()
    }
    table.put_item(Item=item)
    return item

# --- Agent audit log ---

def record_agent_action(clinic_id: str, event_id: str, tool: str, action: str, status: str):
    table = get_table('AgentActions')
    item = {
        'clinic_id': clinic_id,
        'id': str(uuid4()),
        'event_id': event_id,
        'tool': tool,
        'action': action,
        'status': status,
        'timestamp': datetime.now().isoformat(),
    }
    table.put_item(Item=item)
    return item

def list_agent_actions(clinic_id: str):
    table = get_table('AgentActions')
    response = table.query(
        KeyConditionExpression=Key('clinic_id').eq(clinic_id)
    )
    return sorted(response.get('Items', []), key=lambda item: item.get('timestamp', ''), reverse=True)

if __name__ == "__main__":
    init_db()

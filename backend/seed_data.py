import database
import os

def seed():
    database.init_db()
    clinic_id = os.getenv('SEED_CLINIC_ID')
    if not clinic_id:
        raise ValueError('Set SEED_CLINIC_ID before seeding clinic data.')

    patients = [
        {
            'clinic_id': clinic_id,
            'id': 'p-101',
            'name': 'Sarah Jenkins',
            'contact': '555-0101',
            'preferred_contact_method': 'SMS',
            'status': 'ACTIVE'
        },
        {
            'clinic_id': clinic_id,
            'id': 'p-102',
            'name': 'John Doe',
            'contact': '555-0102',
            'preferred_contact_method': 'Email',
            'status': 'ACTIVE'
        }
    ]

    table = database.get_table('Patients')
    for p in patients:
        table.put_item(Item=p)
        print(f"Seeded patient: {p['name']}")

    print("Seeding complete. Ready for Hackathon MVP demo!")

if __name__ == "__main__":
    seed()

import database

def seed():
    database.init_db()
    
    patients = [
        {
            'id': 'p-101',
            'name': 'Sarah Jenkins',
            'contact': '555-0101',
            'preferred_contact_method': 'SMS',
            'status': 'ACTIVE'
        },
        {
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

import sys
sys.path.append('backend')
from backend import database
print(database.get_table('Clinics').scan().get('Items', []))

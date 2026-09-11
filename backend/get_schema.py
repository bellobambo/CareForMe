import os
from dotenv import load_dotenv
load_dotenv()
import boto3

dynamodb = boto3.client('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))

for t in ['CareForMe_Appointments', 'CareForMe_Patients', 'CareForMe_Doctors']:
    desc = dynamodb.describe_table(TableName=t)
    print(t)
    print(desc['Table']['KeySchema'])

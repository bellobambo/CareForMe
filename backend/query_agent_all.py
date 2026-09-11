import os
from dotenv import load_dotenv
load_dotenv()
import boto3

dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))

def scan_table():
    table = dynamodb.Table('CareForMe_AgentActions')
    try:
        response = table.scan()
        for item in response.get('Items', []):
            if item.get('timestamp', '').startswith('2026-09-11T17:2'):
                print(item.get('timestamp'), item.get('tool'), item.get('action'))
    except Exception as e:
        print(e)

scan_table()

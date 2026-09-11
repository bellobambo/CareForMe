import os
from dotenv import load_dotenv
load_dotenv()
import boto3

dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))

def scan_table(name):
    table = dynamodb.Table('CareForMe_' + name)
    try:
        response = table.scan()
        for item in response.get('Items', []):
            if name == 'AgentActions' and item.get('tool') == 'book_appointment':
                print(item)
    except Exception as e:
        print(e)

scan_table('AgentActions')

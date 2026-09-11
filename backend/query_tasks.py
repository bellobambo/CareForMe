import os
from dotenv import load_dotenv
load_dotenv()
import boto3

dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))

table = dynamodb.Table('CareForMe_Tasks')
for item in table.scan().get('Items', []):
    print(item)

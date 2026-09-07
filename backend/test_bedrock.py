import boto3
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

def test_bedrock_connection():
    print("Initializing Bedrock client...")
    try:
        # Create a Bedrock client
        client = boto3.client(
            service_name='bedrock',
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        
        # List available foundation models to verify access
        print("Fetching available models...")
        response = client.list_foundation_models()
        
        models = response.get('modelSummaries', [])
        print(f"✅ Success! Connected to AWS Bedrock.")
        print(f"Found {len(models)} models available in your region.")
        
        # Print a few model names as proof
        for model in models[:5]:
            print(f" - {model['modelId']}")
            
    except Exception as e:
        print("❌ Failed to connect to AWS Bedrock.")
        print(f"Error: {e}")

if __name__ == "__main__":
    test_bedrock_connection()

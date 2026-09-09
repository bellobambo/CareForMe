import os
import urllib.request
import json
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk
from jose.utils import base64url_decode

security = HTTPBearer()

COGNITO_REGION = os.getenv("AWS_REGION", "us-east-1")
COGNITO_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID")

# Cache for the JWKS
_jwks = None

def get_jwks():
    global _jwks
    if not _jwks:
        jwks_url = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_POOL_ID}/.well-known/jwks.json"
        try:
            with urllib.request.urlopen(jwks_url) as response:
                _jwks = json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Failed to fetch JWKS: {e}")
            return None
    return _jwks

def verify_cognito_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    
    # Check for mock token in dev environment
    if os.getenv("ENV") == "development" and token.startswith("mock_token_"):
        return token.split("mock_token_")[1]

    jwks = get_jwks()
    if not jwks:
        raise HTTPException(status_code=500, detail="Could not fetch JWKS")

    try:
        # Get unverified headers to extract 'kid'
        headers = jwt.get_unverified_headers(token)
        kid = headers.get('kid')
        
        # Find the matching key
        key_index = -1
        for i, key in enumerate(jwks['keys']):
            if kid == key['kid']:
                key_index = i
                break
                
        if key_index == -1:
            raise HTTPException(status_code=401, detail="Public key not found in jwks.json")

        # Verify the token
        public_key = jwk.construct(jwks['keys'][key_index])
        message, encoded_signature = str(token).rsplit('.', 1)
        decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))
        
        if not public_key.verify(message.encode("utf8"), decoded_signature):
            raise HTTPException(status_code=401, detail="Signature verification failed")

        claims = jwt.get_unverified_claims(token)
        
        # In a real scenario, you'd also verify claims['aud'] == COGNITO_APP_CLIENT_ID
        # For Cognito, the clinic_id is usually a custom attribute like 'custom:clinic_id' 
        # or we look up the clinic_id by email in the database.
        # Assuming we store clinic_id in 'custom:clinic_id' during registration:
        clinic_id = claims.get('custom:clinic_id')
        
        if not clinic_id:
            # Fallback: lookup by email if custom attribute is not set
            email = claims.get('email')
            import database
            clinics = database.get_table('Clinics').scan().get('Items', [])
            clinic = next((c for c in clinics if c.get('admin_email') == email), None)
            if clinic:
                clinic_id = clinic['clinic_id']
            else:
                raise HTTPException(status_code=401, detail="Clinic not found for this user")

        return clinic_id

    except Exception as e:
        print(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_clinic_id(clinic_id: str = Security(verify_cognito_token)):
    return clinic_id

import os
from fastapi import HTTPException, Security, Request
from fastapi.security.api_key import APIKeyHeader
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Define the limiter
limiter = Limiter(key_func=get_remote_address)

# API Key Setup
API_KEY_NAME = "X-API-Key"
API_KEY = os.getenv("API_KEY", "studio_series_secret_2024")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate credentials")

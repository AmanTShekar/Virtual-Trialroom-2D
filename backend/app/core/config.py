import os
from dotenv import load_dotenv

# Explicitly load the .env file
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Studio Series API"
    
    # AI Engine Settings (Must be set in .env or HF Secrets)
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    MOCK_AI_PIPELINE: bool = os.getenv("MOCK_AI_PIPELINE", "false").lower() == "true"
    
    # Security & Limits
    MAX_IMAGE_SIZE_MB: int = 10
    
    # API Key for private access (Set in .env)
    API_KEY: str = os.getenv("API_KEY", "")
    
    # CORS Origins
    _origins = os.getenv("ALLOWED_ORIGINS", "*")
    ALLOWED_ORIGINS: list = _origins.split(",") if _origins != "*" else ["*"]

settings = Settings()

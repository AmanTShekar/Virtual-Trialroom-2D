from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from dotenv import load_dotenv
from app.api.routes import tryon_v5, analyze
from app.core.security import limiter, _rate_limit_exceeded_handler, RateLimitExceeded

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Detect Environment
IS_HF = "SPACE_ID" in os.environ
ENVIRONMENT = "Hugging Face" if IS_HF else "Local Machine"

app = FastAPI(
    title=f"STUDIO SERIES API [{ENVIRONMENT}]", 
    version="2.1.0",
    docs_url="/docs" if not IS_HF else None # Optional: hide docs on HF if public
)

# Setup Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Security & Payload Middleware ──────────────
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB limit

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_FILE_SIZE:
        return JSONResponse(status_code=413, content={"detail": "File too large (Max 10MB)"})
    
    response = await call_next(request)
    
    # Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Standard CORS Middleware - Dynamic for Local/Production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
if not IS_HF:
    # Automatically allow local dev tools when running locally
    allowed_origins.extend(["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"])

# Filter out empty strings
allowed_origins = [o for o in allowed_origins if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"], # Fallback to * only if absolutely empty
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": f"Internal Server Error: {str(exc)}"}
    )

app.include_router(tryon_v5.router, prefix="/api/v5", tags=["tryon"])
app.include_router(analyze.router, prefix="/api/v5", tags=["analyze"])

@app.get("/")
async def root():
    return {
        "message": "STUDIO SERIES Virtual Trial Room API",
        "env": ENVIRONMENT,
        "docs": "/docs" if not IS_HF else "Private"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "env": ENVIRONMENT,
        "features": ["secure-api", "rate-limiting", "smart-detection"],
    }

if __name__ == "__main__":
    import uvicorn
    # Hugging Face MUST use 7860, Local uses 8081
    default_port = 7860 if IS_HF else 8081
    port = int(os.getenv("PORT", default_port))
    
    print(f"\n🚀 STARTING STUDIO SERIES API")
    print(f"🌍 ENVIRONMENT: {ENVIRONMENT}")
    print(f"🔌 PORT: {port}")
    print(f"🔒 CORS ORIGINS: {allowed_origins}\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port)

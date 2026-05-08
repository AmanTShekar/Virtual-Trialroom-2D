from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Form, Request
import logging
import uuid
import base64
import io
from PIL import Image
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency imported from core security
from app.core.security import get_api_key, limiter
from fastapi import Depends

# In-memory store for v5 jobs
_EAGER_RESULTS = {}

def _b64_to_pil(b64: str) -> Image.Image:
    if "base64," in b64:
        b64 = b64.split("base64,")[1]
    data = base64.b64decode(b64)
    return Image.open(io.BytesIO(data)).convert("RGB")

def _pil_to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

def _process_and_validate_image(data: bytes) -> bytes:
    """Confirm file is a real image and STRIP metadata for privacy."""
    try:
        img = Image.open(io.BytesIO(data))
        # Strip EXIF/Metadata
        data_io = io.BytesIO()
        img.save(data_io, format=img.format)
        return data_io.getvalue()
    except Exception as e:
        logger.error(f"Image validation/stripping failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file format")

def run_tryon_background(job_id: str, person_b64: str, garment_b64: str, garment_type: str, garment_des: str, custom_url: str = None, use_mock: bool = False):
    try:
        _EAGER_RESULTS[job_id]["status"] = "Preparing Assets..."
        person_img = _b64_to_pil(person_b64)
        garment_img = _b64_to_pil(garment_b64)
        
        if use_mock or settings.MOCK_AI_PIPELINE:
            _EAGER_RESULTS[job_id]["status"] = "Connecting to Virtual Engine (MOCK)..."
            import time
            logger.info(f"🧪 V5 MOCK MODE: Simulating inference for job {job_id}")
            time.sleep(2) # Short delay to feel real
            _EAGER_RESULTS[job_id]["status"] = "Running Diffusion Inference (MOCK)..."
            time.sleep(3)
            result_img = person_img # Return same image as mock
        else:
            _EAGER_RESULTS[job_id]["status"] = f"Connecting to GPU ({'Custom Link' if custom_url else 'Global Gradio'})..."
            from app.services.tryon_service import TryOnService
            # Use custom_url if provided, else default
            svc = TryOnService(api_url=custom_url) if custom_url else TryOnService()
            
            _EAGER_RESULTS[job_id]["status"] = "Running Diffusion Inference..."
            # This is a synchronous call to Gradio
            result_img = svc.run(person_img, garment_img, garment_des)
        
        _EAGER_RESULTS[job_id]["status"] = "Finalizing Result..."
        result_b64 = _pil_to_b64(result_img)
        
        # Atomically update status and result to prevent polling race conditions
        _EAGER_RESULTS[job_id].update({
            "status": "SUCCESS",
            "result": {
                "status": "success",
                "result_b64": result_b64,
                "message": "Try-on completed successfully"
            }
        })
        logger.info(f"V5: Job {job_id} completed. Base64 length: {len(result_b64)}")
        
    except Exception as e:
        logger.error(f"V5: Job {job_id} failed: {str(e)}")
        _EAGER_RESULTS[job_id].update({
            "status": "FAILURE",
            "result": {"status": "error", "error": str(e)}
        })

# Obfuscated route for better security
@router.post("/execute_x92k_tryon", dependencies=[Depends(get_api_key)])
@limiter.limit("5/minute")
async def create_tryon_job(
    request: Request,
    background_tasks: BackgroundTasks,
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    garment_type: str = Form("upper"),
    garment_des: str = Form("a stylish garment"),
    keypoints: str = Form("[]"),
    custom_url: str = Form(None),
    use_mock: bool = Form(False)
):
    job_id = str(uuid.uuid4())
    _EAGER_RESULTS[job_id] = {"status": "Initializing...", "result": None}
    
    # Read images and VALIDATE + STRIP metadata
    p_bytes = await person_image.read()
    g_bytes = await garment_image.read()
    
    # Process and sanitize
    p_bytes_clean = _process_and_validate_image(p_bytes)
    g_bytes_clean = _process_and_validate_image(g_bytes)
    
    p_b64 = base64.b64encode(p_bytes_clean).decode()
    g_b64 = base64.b64encode(g_bytes_clean).decode()
    
    background_tasks.add_task(run_tryon_background, job_id, p_b64, g_b64, garment_type, garment_des, custom_url, use_mock)
    
    return {"job_id": job_id, "status": "pending"}

# Keeping the full name as alias for backward compatibility if needed
@router.post("/tryon_v5_full")
async def create_tryon_job_v5(
    background_tasks: BackgroundTasks,
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    garment_type: str = Form("upper"),
    garment_des: str = Form("a stylish garment"),
    keypoints: str = Form("[]"),
    custom_url: str = Form(None),
    use_mock: bool = Form(False)
):
    return await create_tryon_job(background_tasks, person_image, garment_image, garment_type, garment_des, keypoints, custom_url, use_mock)

@router.get("/status/{job_id}", dependencies=[Depends(get_api_key)])
async def get_job_status(job_id: str):
    if job_id in _EAGER_RESULTS:
        return {
            "job_id": job_id,
            "status": _EAGER_RESULTS[job_id]["status"],
            "result": _EAGER_RESULTS[job_id]["result"]
        }
    return {"job_id": job_id, "status": "NOT_FOUND"}

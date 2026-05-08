"""
analyze.py — /api/v1/analyze-photo endpoint
--------------------------------------------
Accepts a user photo and returns:
 - photo_type: 'face' | 'upper_body' | 'body' | 'unknown'
 - Full face profile (skin tone, eye color, hair color, face shape)
 - Dominant image colors
 - For body photos: body bbox from pose keypoints
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional
import numpy as np
from PIL import Image
import io
import logging

from app.services.face_analysis_service import FaceAnalysisService
from app.core.security import get_api_key

logger = logging.getLogger(__name__)
router = APIRouter()

# Singleton service (initialized once on worker startup)
_face_analysis_svc: Optional[FaceAnalysisService] = None

def get_face_analysis_service() -> FaceAnalysisService:
    global _face_analysis_svc
    if _face_analysis_svc is None:
        _face_analysis_svc = FaceAnalysisService()
    return _face_analysis_svc


def _upload_to_numpy(upload: UploadFile) -> np.ndarray:
    """Read an UploadFile and decode to RGB numpy array."""
    content = upload.file.read()
    upload.file.seek(0)  # Reset for potential re-read
    img = Image.open(io.BytesIO(content)).convert("RGB")
    return np.array(img)


@router.post("/analyze-photo", dependencies=[Depends(get_api_key)])
async def analyze_photo(
    photo: UploadFile = File(..., description="User photo — face or full-body"),
):
    """
    Analyze a user photo to extract facial profile and dominant colors.
    """
    if not photo.content_type.startswith("image/"):
        logger.error(f"Invalid content type: {photo.content_type}")
        raise HTTPException(status_code=400, detail="File must be an image")

    logger.info(f"Received photo analysis request: {photo.filename} ({photo.content_type})")
    try:
        image_np = _upload_to_numpy(photo)
    except Exception as e:
        logger.error(f"Image decoding failed: {e}")
        raise HTTPException(status_code=400, detail=f"Could not decode image: {e}")

    try:
        svc = get_face_analysis_service()
    except Exception as e:
        logger.error(f"Failed to get face analysis service: {e}")
        raise HTTPException(status_code=500, detail=f"Service initialization failed: {e}")

    try:
        analysis = svc.analyze(image_np)
    except Exception as e:
        logger.exception(f"Face analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    face_profile_raw = analysis.get("face_profile", {}) or {}

    return {
        "success": True,
        "photo_type": analysis.get("photo_type", "unknown"),
        "face_detected": analysis.get("face_detected", False),
        "face_bbox": analysis.get("face_bbox"),
        "face_profile": {
            "face_shape": face_profile_raw.get("face_shape"),
            "skin_tone":  face_profile_raw.get("skin_tone"),
            "eye_color":  face_profile_raw.get("eye_color"),
            "hair_color": face_profile_raw.get("hair_color"),
            "face_colors": face_profile_raw.get("face_colors", []),
        } if analysis.get("face_detected") else None,
        "dominant_colors": analysis.get("dominant_colors", []),
    }


@router.post("/analyze-photo/quick-type", dependencies=[Depends(get_api_key)])
async def detect_photo_type(
    photo: UploadFile = File(...),
):
    """
    Lightweight endpoint — just returns whether the photo is face or body.
    """
    if not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_np = _upload_to_numpy(photo)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {e}")

    svc = get_face_analysis_service()
    photo_type = svc.detect_photo_type_fast(image_np)

    return {"photo_type": photo_type}

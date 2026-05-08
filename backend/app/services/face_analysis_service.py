"""
face_analysis_service.py
------------------------
Extended face analysis beyond simple detection.
Extracts: skin tone, estimated eye color, face shape, dominant facial colors.
Works in CPU-fallback mode when GPU/InsightFace weights are unavailable.
"""

import numpy as np
import cv2
from PIL import Image
from typing import Optional, Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


# ── Skin tone reference palette (Monk Skin Tone scale, simplified) ──────────
SKIN_TONE_REFS = [
    {"label": "Porcelain",   "hex": "#f6ede4", "rgb": (246, 237, 228)},
    {"label": "Fair",        "hex": "#f3e3d0", "rgb": (243, 227, 208)},
    {"label": "Light",       "hex": "#e8c9a0", "rgb": (232, 201, 160)},
    {"label": "Light-Medium","hex": "#d4a574", "rgb": (212, 165, 116)},
    {"label": "Medium",      "hex": "#c68642", "rgb": (198, 134,  66)},
    {"label": "Medium-Deep", "hex": "#a0522d", "rgb": (160,  82,  45)},
    {"label": "Deep",        "hex": "#7b3d1e", "rgb": (123,  61,  30)},
    {"label": "Rich",        "hex": "#4a1f0e", "rgb": ( 74,  31,  14)},
]

# Eye color palette
EYE_COLOR_REFS = [
    {"label": "Blue",       "hex": "#4a90d9", "rgb": ( 74, 144, 217)},
    {"label": "Green",      "hex": "#5c8b4c", "rgb": ( 92, 139,  76)},
    {"label": "Hazel",      "hex": "#8b6914", "rgb": (139, 105,  20)},
    {"label": "Brown",      "hex": "#6b3a2a", "rgb": (107,  58,  42)},
    {"label": "Dark Brown", "hex": "#3b1f0e", "rgb": ( 59,  31,  14)},
    {"label": "Gray",       "hex": "#8a9ba8", "rgb": (138, 155, 168)},
    {"label": "Amber",      "hex": "#c68b2e", "rgb": (198, 139,  46)},
]

# Hair color palette
HAIR_COLOR_REFS = [
    {"label": "Black",      "hex": "#1a1a1a", "rgb": ( 26,  26,  26)},
    {"label": "Dark Brown", "hex": "#3b1f0e", "rgb": ( 59,  31,  14)},
    {"label": "Brown",      "hex": "#6b3a2a", "rgb": (107,  58,  42)},
    {"label": "Light Brown","hex": "#a0652a", "rgb": (160, 101,  42)},
    {"label": "Blonde",     "hex": "#c8a96b", "rgb": (200, 169, 107)},
    {"label": "Red",        "hex": "#a0412a", "rgb": (160,  65,  42)},
    {"label": "Gray",       "hex": "#9a9a9a", "rgb": (154, 154, 154)},
    {"label": "White",      "hex": "#f0f0f0", "rgb": (240, 240, 240)},
]


def _color_distance(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> float:
    """Euclidean distance between two RGB colors."""
    return float(np.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2))))


def _nearest_color(rgb: Tuple[int, int, int], palette: List[Dict]) -> Dict:
    """Find the nearest named color from a palette by Euclidean distance."""
    best = min(palette, key=lambda c: _color_distance(rgb, c["rgb"]))
    return best


def _kmeans_dominant(pixels: np.ndarray, k: int = 3) -> List[Tuple[int, int, int]]:
    """
    Simple iterative K-means to find dominant colors.
    pixels: (N, 3) uint8 array of RGB values.
    Returns list of k dominant RGB tuples sorted by cluster size.
    """
    if len(pixels) == 0:
        return [(128, 128, 128)]
    
    pixels_f = pixels.astype(np.float32)
    k = min(k, len(pixels))
    
    # OpenCV K-means
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    flags = cv2.KMEANS_PP_CENTERS
    _, labels, centers = cv2.kmeans(pixels_f, k, None, criteria, 5, flags)
    
    # Sort by cluster size (most dominant first)
    counts = np.bincount(labels.flatten())
    sorted_idx = np.argsort(-counts)
    return [tuple(centers[i].astype(int)) for i in sorted_idx]


def _classify_face_shape(bbox: Tuple[int, int, int, int], landmarks: np.ndarray) -> str:
    """
    Rough face shape classification from bounding box aspect ratio.
    """
    x1, y1, x2, y2 = bbox
    w = x2 - x1
    h = y2 - y1
    ratio = w / max(h, 1)
    
    if ratio < 0.72:
        return "Oblong"
    elif ratio < 0.80:
        return "Oval"
    elif ratio < 0.88:
        return "Heart"
    elif ratio < 0.96:
        return "Rectangle"
    else:
        return "Round"


def _extract_eye_region(image_np: np.ndarray, landmarks: np.ndarray) -> Optional[np.ndarray]:
    """
    Extract the iris region for eye color sampling.
    landmarks: 5-point InsightFace kps → [left_eye, right_eye, nose, left_mouth, right_mouth]
    """
    if landmarks is None or len(landmarks) < 2:
        return None
    
    h, w = image_np.shape[:2]
    eye_pixels = []
    
    for eye_pt in landmarks[:2]:  # left_eye, right_eye
        ex, ey = int(eye_pt[0]), int(eye_pt[1])
        r = 6  # Small iris radius
        x1 = max(0, ex - r)
        y1 = max(0, ey - r)
        x2 = min(w, ex + r)
        y2 = min(h, ey + r)
        crop = image_np[y1:y2, x1:x2]
        if crop.size > 0:
            # Filter out very bright pixels (sclera / reflection)
            mask = np.all(crop < 200, axis=2)
            valid = crop[mask]
            if len(valid) > 0:
                eye_pixels.extend(valid.tolist())
    
    return np.array(eye_pixels) if eye_pixels else None


def _detect_photo_type(image_np: np.ndarray, face_bbox: Optional[Tuple]) -> str:
    """
    Determine if photo is primarily a face photo or full-body photo.
    Logic: if the face occupies > 15% of image area → 'face', else → 'body'.
    Returns: 'face' | 'upper_body' | 'body' | 'unknown'
    """
    if face_bbox is None:
        return "unknown"
    
    x1, y1, x2, y2 = face_bbox
    img_h, img_w = image_np.shape[:2]
    
    face_area = (x2 - x1) * (y2 - y1)
    img_area = img_w * img_h
    
    face_ratio = face_area / max(img_area, 1)
    
    if face_ratio > 0.15:
        return "face"
    elif face_ratio > 0.04:
        return "upper_body"
    else:
        return "body"


class FaceAnalysisService:
    """
    Extended face analysis service.
    Extracts skin tone, eye color, hair color, face shape, dominant colors.
    Fully CPU-compatible — no GPU required.
    """

    def __init__(self, model_root: str = "app/models/insightface"):
        self.face_app = None
        self._init_face_detector(model_root)

    def _init_face_detector(self, model_root: str):
        try:
            # Temporarily disabling InsightFace to troubleshoot 500 error
            # import insightface
            # self.face_app = insightface.app.FaceAnalysis(name="buffalo_l", root=model_root, providers=["CPUExecutionProvider"])
            # self.face_app.prepare(ctx_id=-1, det_size=(640, 640))
            # logger.info("✅ FaceAnalysisService: InsightFace initialized")
            self.face_app = None # Force fallback
        except Exception as e:
            logger.warning(f"⚠️ FaceAnalysisService: InsightFace not available ({e}). "
                           "Using OpenCV fallback for face detection.")
            self.face_app = None

    def _detect_face_opencv(self, image_np: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """Fallback face detection using OpenCV Haar cascade."""
        try:
            gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
            detector = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            faces = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
            if len(faces) == 0:
                return None
            # Largest face
            face = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = face
            return (int(x), int(y), int(x + w), int(y + h))
        except Exception as e:
            logger.error(f"OpenCV face detection failed: {e}")
            return None

    def analyze(self, image_np: np.ndarray) -> Dict:
        """
        Full face analysis pipeline.
        """
        
        img_h, img_w = image_np.shape[:2]

        # ── Step 1: Extract dominant colors from whole image ─────────────────
        small = cv2.resize(image_np, (60, 60))
        pixels_all = small.reshape(-1, 3)
        dominant = _kmeans_dominant(pixels_all, k=5)
        dominant_colors = [
            {"hex": "#{:02x}{:02x}{:02x}".format(*c), "rgb": [int(x) for x in c]}
            for c in dominant
        ]

        # ── Step 2: Detect face ───────────────────────────────────────────────
        bbox = None
        landmarks = None

        if self.face_app is not None:
            try:
                faces = self.face_app.get(image_np)
                if faces:
                    face = sorted(faces, key=lambda f: f.det_score, reverse=True)[0]
                    raw_bbox = face.bbox.astype(int)
                    x1 = max(0, raw_bbox[0])
                    y1 = max(0, raw_bbox[1])
                    x2 = min(img_w, raw_bbox[2])
                    y2 = min(img_h, raw_bbox[3])
                    bbox = (x1, y1, x2, y2)
                    landmarks = face.kps  # 5-point
            except Exception as e:
                logger.error(f"InsightFace error: {e}")

        # OpenCV fallback
        if bbox is None:
            bbox = self._detect_face_opencv(image_np)

        result = {
            "photo_type": _detect_photo_type(image_np, bbox),
            "face_detected": bbox is not None,
            "face_bbox": list(bbox) if bbox else None,
            "face_profile": {
                "skin_tone": None,
                "eye_color": None,
                "hair_color": None,
                "face_shape": "Rectangle",
                "face_colors": [],
            },
            "dominant_colors": dominant_colors,
            "success": True
        }

        if bbox is None:
            return result

        result["face_profile"]["face_shape"] = _classify_face_shape(bbox, landmarks)

        x1, y1, x2, y2 = bbox

        # ── Step 3: Skin tone from face center region ─────────────────────────
        fx1 = x1 + int((x2 - x1) * 0.2)
        fy1 = y1 + int((y2 - y1) * 0.2)
        fx2 = x2 - int((x2 - x1) * 0.2)
        fy2 = y2 - int((y2 - y1) * 0.2)
        face_region = image_np[fy1:fy2, fx1:fx2]

        if face_region.size > 0:
            r, g, b = face_region[:, :, 0], face_region[:, :, 1], face_region[:, :, 2]
            skin_mask = (r > 60) & (g > 40) & (b > 30) & (r < 250) & (r > g) & (r > b)
            skin_pixels = face_region[skin_mask]

            if len(skin_pixels) > 20:
                mean_skin = tuple(skin_pixels.mean(axis=0).astype(int))
                skin_ref = _nearest_color(mean_skin, SKIN_TONE_REFS)
                result["face_profile"]["skin_tone"] = skin_ref

                # Face dominant colors
                face_dominant = _kmeans_dominant(skin_pixels, k=3)
                result["face_profile"]["face_colors"] = [
                    {"hex": "#{:02x}{:02x}{:02x}".format(*c), "rgb": [int(x) for x in c]}
                    for c in face_dominant
                ]

        # ── Step 4: Eye color ─────────────────────────────────────────────────
        if landmarks is not None:
            eye_pixels = _extract_eye_region(image_np, landmarks)
            if eye_pixels is not None and len(eye_pixels) > 5:
                mean_eye = tuple(eye_pixels.mean(axis=0).astype(int))
                eye_ref = _nearest_color(mean_eye, EYE_COLOR_REFS)
                result["face_profile"]["eye_color"] = eye_ref

        # ── Step 5: Hair color (top 20% of face bbox, above face) ────────────
        hair_y1 = max(0, y1 - int((y2 - y1) * 0.4))
        hair_y2 = y1 + int((y2 - y1) * 0.1)
        hair_x1 = x1
        hair_x2 = x2
        hair_region = image_np[hair_y1:hair_y2, hair_x1:hair_x2]

        if hair_region.size > 0:
            hr, hg, hb = hair_region[:, :, 0], hair_region[:, :, 1], hair_region[:, :, 2]
            hair_mask = (hr + hg + hb) < 600
            hair_pixels = hair_region[hair_mask]
            if len(hair_pixels) > 20:
                mean_hair = tuple(hair_pixels.mean(axis=0).astype(int))
                hair_ref = _nearest_color(mean_hair, HAIR_COLOR_REFS)
                result["face_profile"]["hair_color"] = hair_ref

        return self._sanitize_for_json(result)

    def _sanitize_for_json(self, obj):
        if isinstance(obj, dict):
            return {k: self._sanitize_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._sanitize_for_json(v) for v in obj]
        elif isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    def detect_photo_type_fast(self, image_np: np.ndarray) -> str:
        """
        Quick check: is this a face photo or body photo?
        """
        bbox = self._detect_face_opencv(image_np)
        return _detect_photo_type(image_np, bbox)

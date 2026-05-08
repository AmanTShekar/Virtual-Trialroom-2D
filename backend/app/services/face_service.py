import numpy as np
import cv2
from PIL import Image
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class FaceService:
    def __init__(self, model_root: str = "app/models/insightface"):
        try:
            import insightface  # Lazy import — prevents startup crash if not installed
            # Buffalo_L is the high-accuracy model pack for InsightFace
            self.app = insightface.app.FaceAnalysis(
                name="buffalo_l",
                root=model_root,
                providers=["CPUExecutionProvider"],  # CPU first for stability
            )
            self.app.prepare(ctx_id=-1, det_size=(640, 640))
            logger.info("✅ FaceService: InsightFace ready")
        except Exception as e:
            logger.warning(f"⚠️ FaceService: InsightFace unavailable — running in mock mode. {e}")
            self.app = None


    def extract_face(self, image_np: np.ndarray) -> Optional[Dict]:
        """
        Detects faces and extracts the primary face with landmarks and bbox.
        Returns dict containing bbox, landmarks, and the face crop.
        """
        if self.app is None:
            return None
            
        faces = self.app.get(image_np)
        if not faces:
            return None

        
        # Sort by score and take the most prominent face
        face = sorted(faces, key=lambda f: f.det_score, reverse=True)[0]
        bbox = face.bbox.astype(int)           # [x1, y1, x2, y2]
        landmarks = face.kps                   # 5-point: eyes, nose, mouth corners
        
        x1, y1, x2, y2 = bbox
        # Add slight padding to capture the full jawline and forehead
        padding = 20
        x1 = max(0, x1 - padding)
        y1 = max(0, y1 - padding)
        x2 = min(image_np.shape[1], x2 + padding)
        y2 = min(image_np.shape[0], y2 + padding)
        
        face_crop = image_np[y1:y2, x1:x2]
        
        return {
            "bbox": (x1, y1, x2, y2),
            "landmarks": landmarks,
            "face_crop": face_crop,
        }

    def paste_face_back(
        self,
        result_np: np.ndarray,
        original_face_data: Dict,
    ) -> np.ndarray:
        """
        Seamlessly blends the original face back onto the AI-generated result.
        Uses a feathered alpha mask to prevent visible seams.
        """
        face_crop = original_face_data["face_crop"]
        x1, y1, x2, y2 = original_face_data["bbox"]
        
        h = y2 - y1
        w = x2 - x1
        
        # Resize crop if dimensions don't match (should match if resolution is consistent)
        resized_face = cv2.resize(face_crop, (w, h))

        # Generate a feathered alpha mask for smooth blending
        mask = np.ones((h, w), dtype=np.float32)
        feather = max(4, h // 10)  # Feathering width proportional to face size
        
        for i in range(feather):
            alpha = i / feather
            # Blend edges
            if i < h:
                mask[i, :] = alpha
                mask[h - 1 - i, :] = alpha
            if i < w:
                mask[:, i] = np.minimum(mask[:, i], alpha)
                mask[:, w - 1 - i] = np.minimum(mask[:, w - 1 - i], alpha)

        # Expand mask to 3 channels
        mask_3ch = np.stack([mask] * 3, axis=-1)
        
        # Extract Region of Interest from result image
        roi = result_np[y1:y2, x1:x2].astype(np.float32)
        
        # Perform Alpha Blending: result = (original * mask) + (result * (1 - mask))
        blended = resized_face.astype(np.float32) * mask_3ch + roi * (1 - mask_3ch)
        
        # Update result image with blended face
        result_np[y1:y2, x1:x2] = blended.astype(np.uint8)
        
        return result_np

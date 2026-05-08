import numpy as np
from typing import Dict, List, Tuple

class PoseService:
    """
    Handles body keypoint normalization and analysis on the backend.
    While MediaPipe runs on the frontend, this service ensures the keypoints 
    are in the correct format for the AI try-on engine (HR-VITON/DWPose).
    """
    
    def __init__(self):
        # 18-point skeleton mapping (standard for many Try-On models)
        self.LIP_CONNECTIONS = [
            (0, 1), (0, 2), (1, 3), (2, 4), (5, 6), (5, 7), (7, 9), 
            (6, 8), (8, 10), (5, 11), (6, 12), (11, 13), (12, 14), 
            (13, 15), (14, 16)
        ]

    def normalize_keypoints(self, keypoints: List[Dict], width: int, height: int) -> np.ndarray:
        """
        Converts MediaPipe normalized coordinates to pixel coordinates.
        Returns a numpy array of shape (N, 2).
        """
        pts = []
        for kp in keypoints:
            pts.append([kp['x'] * width, kp['y'] * height])
        return np.array(pts)

    def get_bbox(self, keypoints: np.ndarray) -> Tuple[int, int, int, int]:
        """
        Calculates the bounding box of the detected human body.
        """
        x_min = int(np.min(keypoints[:, 0]))
        y_min = int(np.min(keypoints[:, 1]))
        x_max = int(np.max(keypoints[:, 0]))
        y_max = int(np.max(keypoints[:, 1]))
        
        return (x_min, y_min, x_max, y_max)

import torch
import numpy as np
from PIL import Image
import torchvision.transforms as T
from typing import List

# SCHP Label Map (LIP dataset standard):
# 0: background, 1: hat, 2: hair, 3: sunglasses, 4: upper-clothes,
# 5: skirt, 6: pants, 7: dress, 8: belt, 9: left-shoe, 10: right-shoe,
# 11: face, 12: left-leg, 13: right-leg, 14: left-arm, 15: right-arm,
# 16: bag, 17: scarf, 18: torso-skin, 19: left-hand, 20: right-hand

UPPER_LABELS = [4]          # Upper clothes
LOWER_LABELS = [5, 6, 7]    # Skirt, pants, dress
PRESERVE_LABELS = [2, 11]   # Hair, face - always preserved

class HumanParserService:
    def __init__(self, model_path: str = "app/models/schp/exp-schp-201908261155-lip.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = T.Compose([
            T.Resize((512, 512)),
            T.ToTensor(),
            T.Normalize(mean=[0.406, 0.456, 0.485], std=[0.225, 0.224, 0.229]),
        ])
        # Note: Model loading requires the SCHP network definitions which will be added in the models phase
        self.model = None 

    def load_model(self):
        """Initializes and loads the ResNet-101 based human parser."""
        # This will be populated once the model architecture files are cloned
        pass

    @torch.no_grad()
    def get_segmentation(self, pil_image: Image.Image) -> np.ndarray:
        """
        Runs human parsing on the image and returns a segmentation label map.
        Labels follow the 20-class LIP standard.
        """
        orig_w, orig_h = pil_image.size
        
        # Placeholder logic if model is not loaded yet (for testing)
        if self.model is None:
            return np.zeros((orig_h, orig_w), dtype=np.uint8)

        inp = self.transform(pil_image).unsqueeze(0).to(self.device)
        output = self.model(inp)
        
        # Get labels with highest probability
        parsing = output[0].argmax(1).squeeze().cpu().numpy()
        
        # Resize back to original image size
        parsing_img = Image.fromarray(parsing.astype(np.uint8)).resize(
            (orig_w, orig_h), Image.NEAREST
        )
        
        return np.array(parsing_img)

    def get_body_mask(self, parsing: np.ndarray, region: str = "upper") -> np.ndarray:
        """
        Creates a binary mask for the specified region (upper or lower).
        Used for erasing existing clothes.
        """
        labels = UPPER_LABELS if region == "upper" else LOWER_LABELS
        mask = np.zeros(parsing.shape, dtype=np.uint8)
        
        for label in labels:
            mask[parsing == label] = 255
            
        return mask

import torch
import numpy as np
from PIL import Image
import torchvision.transforms as T

class ClothMaskService:
    """
    Uses U2Net to generate binary masks for garment images.
    Essential for isolating the clothing item from its background.
    """
    def __init__(self, model_path: str = "app/models/u2net/u2net_cloth_seg.pth"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = T.Compose([
            T.Resize((768, 768)),
            T.ToTensor(),
            T.Normalize([0.5] * 3, [0.5] * 3),
        ])
        self.model = None # Initialized after weights are present

    @torch.no_grad()
    def get_mask(self, cloth_img: Image.Image) -> Image.Image:
        """
        Generates a high-quality binary mask for a flat-lay garment.
        """
        if self.model is None:
            # Fallback to simple alpha check or threshold if model not ready
            return cloth_img.convert("L").point(lambda p: 255 if p > 0 else 0)

        orig_size = cloth_img.size
        inp = self.transform(cloth_img.convert("RGB")).unsqueeze(0).to(self.device)
        
        # U2Net returns multiple side outputs; d1 is the main prediction
        d1, *_ = self.model(inp)
        
        # Normalize and threshold
        pred = d1[:, 0, :, :]
        pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
        
        mask_np = (pred.squeeze().cpu().numpy() * 255).astype(np.uint8)
        mask = Image.fromarray(mask_np).resize(orig_size, Image.BILINEAR)
        
        # Sharpen mask edges
        mask = mask.point(lambda p: 255 if p > 128 else 0)
        
        return mask

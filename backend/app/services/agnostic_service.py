import numpy as np
from PIL import Image, ImageDraw
from typing import Dict

def generate_agnostic(
    person_img: Image.Image,
    parsing: np.ndarray,
    keypoints: Dict,
    region: str = "upper",
) -> Image.Image:
    """
    Creates an 'agnostic' image by erasing the clothing region.
    The erased region is inpainted with a skin-tone estimate from the user's arms.
    This prepares the person image for the HR-VITON model to 'drape' new clothes.
    """
    agnostic = person_img.copy().convert("RGB")
    arr = np.array(agnostic)
    mask = np.zeros(parsing.shape, dtype=np.uint8)

    # 4: upper-clothes, 7: dress
    erase_labels = [4, 7] if region == "upper" else [5, 6]  # 5: skirt, 6: pants
    
    for label in erase_labels:
        mask[parsing == label] = 255

    # Estimate skin tone from visible body parts (14: left-arm, 15: right-arm)
    skin_pixels = arr[(parsing == 14) | (parsing == 15)]
    
    if len(skin_pixels) > 0:
        # Use median or mean skin tone for robustness
        fill_color = tuple(skin_pixels.mean(axis=0).astype(int))
    else:
        # Default fallback to a generic neutral skin tone
        fill_color = (210, 180, 160)

    # Fill the erased clothing region with the estimated skin tone
    for c in range(3):
        arr[:, :, c][mask == 255] = fill_color[c]

    # Add a tiny amount of Gaussian noise to the filled area to match the photo's texture/grain
    noise = np.random.normal(0, 4, arr.shape).astype(np.int16)
    noise_mask = (mask[:, :, np.newaxis] // 255).astype(np.int16)
    arr = np.clip(arr.astype(np.int16) + noise * noise_mask, 0, 255).astype(np.uint8)

    return Image.fromarray(arr)

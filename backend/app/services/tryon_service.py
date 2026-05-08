from PIL import Image
import numpy as np
import tempfile
import os
import logging
try:
    from gradio_client import Client, handle_file
except ImportError:
    from gradio_client import Client, file as handle_file

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("gradio_client").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

class TryOnService:
    def __init__(self, api_url: str = "yisol/IDM-VTON"):
        from app.core.config import settings
        logger.info(f"Initializing IDM-VTON TryOnService via {api_url}")
        hf_token = settings.HF_TOKEN if settings.HF_TOKEN else None
        # Increase internal client timeout to 300s
        self.client = Client(api_url, token=hf_token)

    def run(self, person_img: Image.Image, garment_img: Image.Image, garment_des: str = "a stylish garment") -> Image.Image:
        """
        Runs the highly-realistic IDM-VTON model via HuggingFace Space.
        """
        logger.info("Preparing images for IDM-VTON...")
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f_person, \
             tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f_garment:
             
            person_img.save(f_person.name)
            garment_img.save(f_garment.name)
            
            person_path = f_person.name
            garment_path = f_garment.name

        try:
            logger.info("Sending request to IDM-VTON API (yisol/IDM-VTON)...")
            
            # Using client.submit instead of predict for better long-running task handling
            job = self.client.submit(
                dict={"background": handle_file(person_path), "layers": [], "composite": None},
                garm_img=handle_file(garment_path),
                garment_des=garment_des,
                is_checked=True,
                is_checked_crop=False,
                denoise_steps=30,
                seed=42,
                api_name="/tryon"
            )
            
            import time
            # Manual polling loop to avoid "Read Timeout" on a single long-lived connection
            start_time = time.time()
            result = None
            
            logger.info("Job submitted. Starting manual status polling...")
            while time.time() - start_time < 300: # 5 minute limit
                status = job.status()
                logger.info(f"HuggingFace Job Status: {status.code}")
                
                # Check for FINISHED in both string and enum form
                if str(status.code) == 'FINISHED' or str(status.code).endswith('.FINISHED'):
                    logger.info("HuggingFace Job is FINISHED. Retrieving final result...")
                    try:
                        # Now that it's finished, result() will be near-instant and stable
                        result = job.result(timeout=120)
                    except Exception as res_err:
                        logger.warning(f"Initial result() call failed ({type(res_err).__name__}): {res_err}. Trying last resort fallback...")
                        # Last resort: peek into the job's private output list if available
                        if hasattr(job, '_outputs') and job._outputs:
                            result = job._outputs[-1]
                        else:
                            fallback_outputs = job.outputs()
                            if fallback_outputs:
                                result = fallback_outputs[-1]
                            else:
                                raise res_err
                    break
                elif str(status.code) == 'ERROR' or str(status.code).endswith('.ERROR'):
                    # Check if there are any outputs even on error (sometimes images are partially saved)
                    err_outputs = job.outputs()
                    logger.error(f"HuggingFace Job Error. Partial outputs: {err_outputs}")
                    raise Exception(f"HuggingFace Space returned an error: {status}")
                
                time.sleep(4) # Wait 4 seconds before checking again
            
            if not result:
                raise TimeoutError("IDM-VTON API finished but returned no image data.")
            
            # Robust path extraction from the result
            result_path = None
            if isinstance(result, dict) and "path" in result:
                result_path = result["path"]
            elif isinstance(result, str):
                result_path = result
            elif isinstance(result, (list, tuple)) and len(result) > 0:
                # The result is expected to be [img_path, mask_path] or similar
                item = result[0]
                # Sometimes it's a list of dicts, sometimes a list of strings
                if isinstance(item, dict) and "path" in item:
                    result_path = item["path"]
                elif isinstance(item, str):
                    result_path = item
                else:
                    result_path = str(item)
            
            logger.info(f"Final determined result path: {result_path}")
            if not result_path or not isinstance(result_path, str):
                raise ValueError(f"Could not find a valid image path in result: {result}")

            res_img = Image.open(result_path).convert("RGB")
            logger.info("Image successfully opened and processed.")
            return res_img
            
        except Exception as e:
            logger.exception(f"CRITICAL ERROR ({type(e).__name__}) in TryOnService execution: {e}")
            raise e
        finally:
            if os.path.exists(person_path): os.remove(person_path)
            if os.path.exists(garment_path): os.remove(garment_path)

import { useEffect, useRef, useState } from "react";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

/**
 * Specialized hook for background removal/human parsing.
 */
export function useBodySegmentation() {
  const [segmentationMask, setSegmentationMask] = useState(null);
  const segRef = useRef(null);

  useEffect(() => {
    segRef.current = new SelfieSegmentation({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
    });

    segRef.current.setOptions({
      modelSelection: 1, // 0 for selfie, 1 for landscape/full body
    });

    segRef.current.onResults((results) => {
      if (results.segmentationMask) {
        setSegmentationMask(results.segmentationMask);
      }
    });

    return () => segRef.current.close();
  }, []);

  async function segmentImage(imageElement) {
    if (!segRef.current) return;
    await segRef.current.send({ image: imageElement });
  }

  return { segmentationMask, segmentImage };
}

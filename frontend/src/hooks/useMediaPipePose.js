import { useEffect, useRef, useState } from "react";
import { Pose } from "@mediapipe/pose";

/**
 * Robust MediaPipe Pose Hook.
 * Designed to handle React 18 Strict Mode and prevent "Module.arguments" conflicts.
 */
export function useMediaPipePose() {
  const [keypoints, setKeypoints] = useState(null);
  const [segmentationMask, setSegmentationMask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const poseRef = useRef(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (isInitializing.current || poseRef.current) return;
      isInitializing.current = true;

      try {
        const pose = new Pose({
          locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`,
        });
        
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
          if (!isMounted) return;
          if (results.poseLandmarks) setKeypoints(results.poseLandmarks);
          if (results.segmentationMask) setSegmentationMask(results.segmentationMask);
        });

        await pose.initialize();
        
        if (isMounted) {
          poseRef.current = pose;
          setIsLoading(false);
        } else {
          pose.close();
        }
      } catch (err) {
        console.error("MediaPipe Init Error:", err);
        if (isMounted) setError(err);
      } finally {
        isInitializing.current = false;
      }
    }

    init();

    return () => {
      isMounted = false;
      // We don't close immediately to prevent race conditions during React 18 double-mount
      // The instance will be reused if it's still initializing
    };
  }, []);

  async function processImage(imageElement) {
    if (!poseRef.current || isLoading) return;
    try {
      await poseRef.current.send({ image: imageElement });
    } catch (err) {
      console.error("MediaPipe Processing Error:", err);
      setError(err);
    }
  }

  return { keypoints, segmentationMask, processImage, isLoading, error };
}

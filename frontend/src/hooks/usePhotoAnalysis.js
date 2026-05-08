/**
 * usePhotoAnalysis.js
 * -------------------
 * Hook that calls the backend /analyze-photo endpoint on photo upload.
 * Returns face profile, dominant colors, and photo type detection.
 * Also does client-side color extraction as a fast first pass.
 */

import { useCallback, useRef } from "react";
import { useStore } from "../store/trialRoomStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
const API_KEY = import.meta.env.VITE_API_KEY || "";

// ── Client-side color extraction (canvas-based, instant) ────────────────────
function extractDominantColors(imageElement, numColors = 6) {
  const canvas = document.createElement("canvas");
  const size = 60; // Downsample for speed
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageElement, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  // Build color buckets (quantize to reduce unique colors)
  const buckets = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const a = data[i + 3];
    if (a < 128) continue; // Skip transparent pixels
    const key = `${r},${g},${b}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }

  // Sort by frequency, return top N
  const sorted = Object.entries(buckets)
    .sort(([, a], [, b]) => b - a)
    .slice(0, numColors);

  return sorted.map(([key, count]) => {
    const [r, g, b] = key.split(",").map(Number);
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return { hex, rgb: [r, g, b], count };
  });
}

// ── Quick face-vs-body detection (client-side, instant) ─────────────────────
// Heuristic: check aspect ratio + detect skin-tone region density
function quickPhotoTypeHeuristic(imageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageElement, 0, 0, 80, 80);
  const data = ctx.getImageData(0, 0, 80, 80).data;

  // Check natural image dimensions
  const naturalW = imageElement.naturalWidth || imageElement.width;
  const naturalH = imageElement.naturalHeight || imageElement.height;
  const aspectRatio = naturalW / naturalH;

  // Count skin-tone pixels in top third (face region for portrait/face photos)
  let topSkinCount = 0;
  let totalPixels = 0;
  const topThirdEnd = Math.floor(80 * 0.4) * 80;

  for (let i = 0; i < topThirdEnd * 4; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    totalPixels++;
    // Skin tone heuristic: warm reddish tone
    if (r > 80 && g > 50 && b > 30 && r > g && r > b && r < 250) {
      topSkinCount++;
    }
  }

  const topSkinRatio = topSkinCount / Math.max(totalPixels, 1);

  if (topSkinRatio > 0.25 && aspectRatio > 0.7 && aspectRatio < 1.4) {
    return "face";
  }
  return "body";
}


// ── Main hook ────────────────────────────────────────────────────────────────
export function usePhotoAnalysis() {
  const {
    setPhotoAnalysis,
    setIsAnalyzing,
    setAnalysisError,
    userPhotoUrl,
  } = useStore();

  const abortRef = useRef(null);

  const analyzePhoto = useCallback(
    async (file, imageElement) => {
      // Cancel any previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsAnalyzing(true);

      try {
        // ── Phase 1: Instant client-side analysis ──────────────────────────
        let clientPhotoType = "body";
        let clientColors = [];

        if (imageElement) {
          clientColors = extractDominantColors(imageElement);
          clientPhotoType = quickPhotoTypeHeuristic(imageElement);

          // Immediately update store with client-side results
          setPhotoAnalysis({
            photoType: clientPhotoType,
            faceProfile: null, // Backend will fill this
            dominantColors: clientColors,
          });
        }

        // ── Phase 2: Backend deep analysis ────────────────────────────────
        const formData = new FormData();
        formData.append("photo", file);

        const response = await fetch(`${API_BASE}/api/v5/analyze-photo`, {
          method: "POST",
          headers: {
            "X-API-Key": API_KEY
          },
          body: formData,
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Backend analysis failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setPhotoAnalysis({
            photoType: data.photo_type,
            faceProfile: data.face_profile,
            dominantColors: data.dominant_colors?.length ? data.dominant_colors : clientColors,
          });
        }
      } catch (err) {
        if (err.name === "AbortError") return; // Cancelled, not an error

        console.warn("Backend photo analysis failed, using client-side fallback:", err);
        // Don't set error state — client-side results are already showing
        setIsAnalyzing(false);
      }
    },
    [setPhotoAnalysis, setIsAnalyzing, setAnalysisError]
  );

  return { analyzePhoto };
}

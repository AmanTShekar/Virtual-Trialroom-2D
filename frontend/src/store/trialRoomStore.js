import { create } from "zustand";

/**
 * Global state for the Virtual Trial Room.
 * v2: Added face profile, photo type detection, color analysis.
 */
export const useStore = create((set, get) => ({
  // ── User photo state ─────────────────────────────────────────────────────
  userPhoto: null,          // File object
  userPhotoUrl: null,       // Object URL for display
  keypoints: null,          // MediaPipe 33-point result
  segMask: null,            // Segmentation mask ImageData

  // ── Photo analysis results (from backend /analyze-photo) ─────────────────
  photoType: null,          // 'face' | 'upper_body' | 'body' | 'unknown'
  isAnalyzing: false,       // true while /analyze-photo is in-flight
  faceProfile: null,        // { face_shape, skin_tone, eye_color, hair_color, face_colors }
  dominantColors: [],       // Array of { hex, rgb } — whole-image dominant colors
  analysisError: null,      // Error string if analysis failed

  // ── Garment state ────────────────────────────────────────────────────────
  selectedGarment: null,    // { id, name, imageUrl, maskUrl, category }
  garmentPhoto: null,       // User uploaded garment file
  garmentPhotoUrl: null,    // URL for user uploaded garment
  selectedColor: "#378ADD",
  selectedSize: "M",
  drapeStyle: "relaxed",    // relaxed | fitted | loose
  pattern: "solid",

  // ── Measurements (Initial defaults) ─────────────────────────────────────
  measurements: {
    height: 165,
    chest: 90,
    waist: 72,
    hips: 96,
    shoulder: 40,
    inseam: 76,
  },

  // ── Try-on job results ───────────────────────────────────────────────────
  jobId: null,
  jobStatus: "idle",        // idle | pending | done | error
  resultUrl: null,          // URL or data URL of final try-on image
  jobFaceProfile: null,     // Face profile returned by job (may differ from upload analysis)

  // ── Actions ──────────────────────────────────────────────────────────────
  setUserPhoto: (file) => {
    if (get().userPhotoUrl) URL.revokeObjectURL(get().userPhotoUrl);
    const url = URL.createObjectURL(file);
    set({
      userPhoto: file,
      userPhotoUrl: url,
      resultUrl: null,
      jobId: null,
      jobStatus: "idle",
      // Reset analysis state for new photo
      photoType: null,
      faceProfile: null,
      dominantColors: [],
      analysisError: null,
      isAnalyzing: false,
    });
  },

  setKeypoints: (kp) => set({ keypoints: kp }),
  setSegMask: (mask) => set({ segMask: mask }),
  setGarment: (g) => set({ selectedGarment: g, garmentPhoto: null, garmentPhotoUrl: null, resultUrl: null }),
  setGarmentPhoto: (file) => {
    if (get().garmentPhotoUrl) URL.revokeObjectURL(get().garmentPhotoUrl);
    const url = URL.createObjectURL(file);
    set({
      garmentPhoto: file,
      garmentPhotoUrl: url,
      selectedGarment: { id: 'custom', name: 'Uploaded Garment', type: 'upper' },
      resultUrl: null
    });
  },
  setMeasurement: (key, val) =>
    set((s) => ({ measurements: { ...s.measurements, [key]: val } })),
  setSelectedSize: (s) => set({ selectedSize: s }),
  setColor: (c) => set({ selectedColor: c }),
  setDrapeStyle: (d) => set({ drapeStyle: d }),
  setPattern: (p) => set({ pattern: p }),

  // Analysis results
  setPhotoAnalysis: ({ photoType, faceProfile, dominantColors }) =>
    set({ photoType, faceProfile, dominantColors, isAnalyzing: false, analysisError: null }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysisError: (err) => set({ analysisError: err, isAnalyzing: false }),

  // Job results
  setJobResult: (jobId, status, url, extras = {}) =>
    set({
      jobId,
      jobStatus: status,
      resultUrl: url,
      jobFaceProfile: extras.faceProfile || null,
    }),
}));

// Debugging helper
if (typeof window !== "undefined") {
  window.trialRoomStore = useStore;
}

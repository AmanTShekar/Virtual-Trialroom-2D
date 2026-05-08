import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/trialRoomStore';
import { useMediaPipePose } from '../hooks/useMediaPipePose';
import { usePhotoAnalysis } from '../hooks/usePhotoAnalysis';
import TrialRoomMobile from './TrialRoomMobile';
import TrialRoomDesktop from './TrialRoomDesktop';
// Use environment variables for production readiness
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";
const API_KEY = "studio_series_secret_2024";

const EXAMPLE_GARMENTS = [
  { id: 1, name: 'Minimalist Sweater', type: 'upper', image: '/images/examples/dress1.png' },
  { id: 2, name: 'Silk Blouse', type: 'upper', image: '/images/examples/dress2.png' }
];

const GUIDES = {
  person: [
    { title: 'POSSIBLE', img: '/images/guide/good_person.png', status: 'good', desc: 'Front-facing, clear lighting, tight clothes' },
    { title: 'NOT WORKING', img: '/images/guide/bad_person.png', status: 'bad', desc: 'Back turned, blurry, cluttered background' }
  ],
  garment: [
    { title: 'POSSIBLE', img: '/images/guide/good_garment.png', status: 'good', desc: 'Complete white background, high contrast, flat-lay' },
    { title: 'NOT WORKING', img: '/images/guide/bad_garment.png', status: 'bad', desc: 'No hats, no accessories, worn clothes, dark background' }
  ]
};

export default function TrialRoom({ onBack }) {
  const {
    setUserPhoto, userPhoto, userPhotoUrl,
    garmentPhoto, setGarmentPhoto, garmentPhotoUrl,
    selectedGarment, setGarment,
    jobStatus, setJobResult,
    resultUrl, photoType, isAnalyzing
  } = useStore();

  const [activeTab, setActiveTab] = useState('person'); // person | garment
  const [timeLeft, setTimeLeft] = useState(25);
  const [garmentDes, setGarmentDes] = useState('a stylish garment');
  const [backendStatus, setBackendStatus] = useState('');
  
  // ── Connection Settings ──────────────────────────────────────────────────
  const [connectionMode, setConnectionMode] = useState('cloud'); // cloud | custom | mock
  const [colabUrl, setColabUrl] = useState('');

  const fileInputRef = useRef(null);
  const garmInputRef = useRef(null);

  const { processImage, isLoading: poseLoading } = useMediaPipePose();
  const { analyzePhoto } = usePhotoAnalysis();

  // ── Estimated Progress Logic ──────────────────────────────────────────────
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let interval;
    if (jobStatus === 'pending') {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + (prev < 50 ? 5 : 2);
          return 95;
        });
      }, 1000);
    } else if (jobStatus === 'done') {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [jobStatus]);

  // ── Handle file upload (Garment) ───────────────────────────────────────────
  const handleGarmentFile = useCallback((file) => {
    if (!file) return;
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      
      const padding = 10;
      let whiteCount = 0;
      const points = [
        {x: padding, y: padding},
        {x: img.width - padding, y: padding},
        {x: padding, y: img.height - padding},
        {x: img.width - padding, y: img.height - padding}
      ];
      
      points.forEach(p => {
        try {
          const pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
          if (pixel[0] > 230 && pixel[1] > 230 && pixel[2] > 230) whiteCount++;
        } catch(e) {}
      });

      if (whiteCount < 3) {
        alert("Upload rejected: Please upload a garment with a solid white background, high contrast, and no hats/accessories.");
        return;
      }

      setGarmentPhoto(file);
      setGarment({ id: 'custom', name: 'Custom Upload', image: URL.createObjectURL(file), type: 'upper' });
    };
  }, [setGarmentPhoto, setGarment]);

  // ── Handle file upload (Person) ────────────────────────────────────────────
  const handlePersonFile = useCallback(async (file) => {
    if (!file) return;
    setUserPhoto(file);
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      if (processImage) await processImage(img);
      await analyzePhoto(file, img);
    };
  }, [setUserPhoto, processImage, analyzePhoto]);

  // ── Handle try-on ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!userPhoto || !selectedGarment || jobStatus === 'pending') return;
    
    setJobResult(null, 'pending', null);
    setBackendStatus('Initializing...');

    try {
      const formData = new FormData();
      formData.append('person_image', userPhoto);
      
      if (garmentPhoto) {
        formData.append('garment_image', garmentPhoto);
      } else if (selectedGarment.image) {
        const gRes = await fetch(selectedGarment.image);
        const gBlob = await gRes.blob();
        formData.append('garment_image', gBlob, 'garment.png');
      }

      formData.append('garment_type', selectedGarment.type || 'upper');
      formData.append('garment_des', garmentDes || 'a stylish garment');
      formData.append('keypoints', JSON.stringify([])); 
      
      if (connectionMode === 'custom' && colabUrl) {
        formData.append('custom_url', colabUrl);
      }
      
      if (connectionMode === 'mock') {
        formData.append('use_mock', 'true');
      }
      
      const res = await fetch(`${API_BASE}/api/v5/execute_x92k_tryon`, { 
        method: 'POST', 
        body: formData,
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Backend Error: ${res.status} - ${errText}`);
      }
      
      const data = await res.json();
      const jobId = data.job_id;
      
      let retryCount = 0;
      const poll = setInterval(async () => {
        try {
          const sr = await fetch(`${API_BASE}/api/v5/status/${jobId}`, {
            headers: {
              'X-API-Key': API_KEY
            }
          });
          if (!sr.ok) throw new Error("Poll failed");
          
          const sd = await sr.json();
          setBackendStatus(sd.status);

          if (sd.status === 'SUCCESS' || (sd.result && sd.result.status === 'success')) {
            const r = sd.result || sd;
            const url = r.result_b64 
              ? (r.result_b64.startsWith('data:') ? r.result_b64 : `data:image/png;base64,${r.result_b64}`)
              : r.image_url;
            
            if (url) {
              setJobResult(jobId, 'done', url);
            } else {
              setJobResult(jobId, 'error', null);
            }
            clearInterval(poll);
          } else if (sd.status === 'FAILURE' || (sd.result && sd.result.status === 'error')) {
            setJobResult(jobId, 'error', null);
            clearInterval(poll);
          }
        } catch (err) {
          retryCount++;
          if (retryCount > 60) {
            setJobResult(jobId, 'error', null);
            clearInterval(poll);
          }
        }
      }, 4000);
    } catch (err) {
      console.error("Generation failed:", err);
      setJobResult(null, 'error', null);
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `studio-series-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resultUrl]);

  const viewProps = {
    activeTab, setActiveTab,
    connectionMode, setConnectionMode, colabUrl, setColabUrl,
    userPhoto, userPhotoUrl, handlePersonFile, poseLoading, isAnalyzing,
    garmentPhoto, selectedGarment, setGarment, garmentDes, setGarmentDes, handleGarmentFile,
    jobStatus, resultUrl, setJobResult, progress, backendStatus,
    handleGenerate, handleDownload, GUIDES, EXAMPLE_GARMENTS, onBack
  };

  return isMobile ? <TrialRoomMobile {...viewProps} /> : <TrialRoomDesktop {...viewProps} />;
}


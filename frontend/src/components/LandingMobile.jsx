import React, { useEffect } from 'react';
import Brutalist3DModel from './Brutalist3DModel';

export default function LandingMobile({ onLaunch }) {
  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans selection:bg-neutral-800 overflow-x-hidden">
      
      {/* ── HEADER ── */}
      <nav className="p-5 border-b border-neutral-800 flex justify-between items-center bg-black">
        <div className="font-bold tracking-widest text-[10px] uppercase flex items-center gap-2">
          <div className="w-4 h-4 bg-white text-black flex items-center justify-center text-[8px]">S</div>
          STUDIO_SERIES
        </div>
        <span className="font-mono text-[9px] text-neutral-500">SYS_ONLINE</span>
      </nav>

      {/* ── HERO FACTS ── */}
      <div className="p-6 border-b border-neutral-800">
        <h1 className="text-4xl font-bold tracking-tighter uppercase leading-[0.9] mb-4">
          STUDIO<br/>SERIES V3.
        </h1>
        <p className="font-mono text-xs text-neutral-400 leading-relaxed mb-8">
          The most accessible high-fidelity virtual try-on engine. We've optimized the IDM-VTON architecture to run flawlessly on consumer hardware without compromising photorealism.
        </p>
        
        <button onClick={onLaunch} className="w-full py-4 bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors active:scale-95 border border-white">
          INITIALIZE TRIAL ROOM →
        </button>
      </div>

      {/* ── DATA GRID ── */}
      <div className="grid grid-cols-2 gap-[1px] bg-neutral-800 border-b border-neutral-800">
        <div className="bg-black p-5">
          <p className="font-mono text-[9px] text-neutral-500 mb-1 uppercase">Inference Target</p>
          <p className="text-xl font-medium tracking-tight">Cloud Proxy</p>
        </div>
        <div className="bg-black p-5">
          <p className="font-mono text-[9px] text-neutral-500 mb-1 uppercase">Web Framework</p>
          <p className="text-xl font-medium tracking-tight">FastAPI</p>
        </div>
        <div className="bg-black p-5">
          <p className="font-mono text-[9px] text-neutral-500 mb-1 uppercase">Job Queue</p>
          <p className="text-xl font-medium tracking-tight">BackgndTasks</p>
        </div>
        <div className="bg-black p-5">
          <p className="font-mono text-[9px] text-neutral-500 mb-1 uppercase">Client Defense</p>
          <p className="text-xl font-medium tracking-tight">HTML5 Canvas</p>
        </div>
      </div>

      {/* ── TECHNICAL SPECS ── */}
      <div className="p-6 bg-[#050505] border-b border-neutral-800">
        <h2 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6 border-b border-neutral-800 pb-2">Execution Pipeline</h2>
        
        <div className="space-y-6">
          {[
            { step: '01', title: 'Gradio Proxy', desc: 'Bypassing local VRAM constraints entirely by offloading inference to HuggingFace Gradio APIs via python client.' },
            { step: '02', title: 'FastAPI Background', desc: 'Replaced HTTP blocking with BackgroundTasks and an in-memory job dict. Frontend executes interval-based polling.' },
            { step: '03', title: 'Canvas Heuristics', desc: 'Local device counts RGB(255,255,255) pixels to validate background contrast before network transmission.' }
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <span className="font-mono text-[10px] text-neutral-600 mt-0.5">{item.step}</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide mb-1">{item.title}</h4>
                <p className="font-mono text-[10px] text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3D MODULE ── */}
      <div className="p-6 bg-black">
        <div className="border border-neutral-800 p-6 relative overflow-hidden flex flex-col text-left">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />
          
          <h2 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4">Phase 4 Development</h2>
          <h3 className="text-2xl font-bold tracking-tight uppercase mb-3">Spatial Avatars [3D]</h3>
          <p className="font-mono text-[10px] text-neutral-400 leading-relaxed mb-6">
            Our current pipeline perfects 2D garment transfer. Next, we bridge the spatial gap. We are actively engineering a proprietary 3D mesh wrapper that calculates depth-maps from standard photos, wrapping virtual garments around fully navigable, 360-degree body models.
          </p>
          <div className="flex items-center justify-between gap-4 w-full">
            <span className="px-2 py-1 border border-neutral-700 font-mono text-[9px] uppercase text-neutral-300">Status: R&D</span>
            <div className="text-[9px] font-mono text-neutral-500 uppercase flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              Orbit Controls
            </div>
          </div>
          
          <div className="mt-8 mb-4 w-full h-64 bg-[#0a0a0a] border border-neutral-800">
            <Brutalist3DModel />
          </div>
        </div>
      </div>

    </div>
  );
}

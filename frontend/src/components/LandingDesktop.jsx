import React, { useEffect } from 'react';
import Brutalist3DModel from './Brutalist3DModel';

export default function LandingDesktop({ onLaunch }) {
  return (
    <div className="h-screen bg-black text-white font-sans selection:bg-neutral-800 overflow-hidden flex flex-col">
      
      {/* ── HEADER ── */}
      <nav className="shrink-0 px-8 py-4 border-b border-neutral-800 flex justify-between items-center bg-black">
        <div className="font-bold tracking-widest text-[11px] uppercase flex items-center gap-3">
          <div className="w-5 h-5 bg-white text-black flex items-center justify-center text-[10px]">S</div>
          STUDIO_SERIES <span className="text-neutral-600 font-mono border-l border-neutral-800 pl-3 ml-2">SYS_ONLINE</span>
        </div>
        <div className="font-mono text-[10px] text-neutral-500 uppercase">
          Build 3.0 / Architecture Spec
        </div>
      </nav>

      {/* ── MAIN CONTENT (Split View) ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: FACT SHEET */}
        <div className="w-1/2 flex flex-col justify-between overflow-y-auto custom-scroll border-r border-neutral-800 p-16 bg-black">
          
          <div>
            <h1 className="text-7xl font-bold tracking-tighter uppercase leading-[0.85] mb-6">
              STUDIO<br/>SERIES V3.
            </h1>
            <p className="font-mono text-sm text-neutral-400 leading-relaxed max-w-md">
              The world's most accessible high-fidelity virtual try-on engine. We've optimized the IDM-VTON architecture to run flawlessly on consumer hardware without compromising photorealism.
            </p>
          </div>

          <div className="mt-16 w-full">
            <div className="grid grid-cols-2 gap-[1px] bg-neutral-800 border border-neutral-800 mb-12">
              <div className="bg-black p-6">
                <p className="font-mono text-[10px] text-neutral-500 mb-1 uppercase">Inference Target</p>
                <p className="text-2xl font-medium tracking-tight">Cloud GPU Proxy</p>
              </div>
              <div className="bg-black p-6">
                <p className="font-mono text-[10px] text-neutral-500 mb-1 uppercase">Web Framework</p>
                <p className="text-2xl font-medium tracking-tight">FastAPI</p>
              </div>
              <div className="bg-black p-6">
                <p className="font-mono text-[10px] text-neutral-500 mb-1 uppercase">Job Queue</p>
                <p className="text-2xl font-medium tracking-tight">BackgroundTasks</p>
              </div>
              <div className="bg-black p-6">
                <p className="font-mono text-[10px] text-neutral-500 mb-1 uppercase">Client Defense</p>
                <p className="text-2xl font-medium tracking-tight">HTML5 Canvas</p>
              </div>
            </div>

            <button onClick={onLaunch} className="w-full py-5 bg-white text-black hover:bg-neutral-200 transition-colors font-bold text-xs uppercase tracking-[0.2em] border border-white">
              Initialize Trial Room →
            </button>
          </div>
          
        </div>

        {/* RIGHT: TECHNICAL LOGS & 3D */}
        <div className="w-1/2 overflow-y-auto custom-scroll bg-[#050505] p-16">
          
          {/* Pipeline */}
          <div className="mb-16">
            <h2 className="font-mono text-[10px] text-white uppercase tracking-widest mb-8 border-b border-neutral-800 pb-2">Execution Pipeline</h2>
            
            <div className="space-y-8">
              {[
                { 
                  step: '01', title: 'Gradio Client Proxy', 
                  desc: 'Bypassing local VRAM constraints entirely by offloading inference to HuggingFace Gradio APIs via python gradio_client.',
                  code: "job = client.submit(..., api_name='/tryon')"
                },
                { 
                  step: '02', title: 'FastAPI Background Orchestration', 
                  desc: 'Replaced HTTP blocking with BackgroundTasks and an in-memory job dictionary. Frontend executes interval-based polling.',
                  code: "_EAGER_RESULTS[job_id] = {'status': 'Init'}\nbackground_tasks.add_task(run_tryon)"
                },
                { 
                  step: '03', title: 'Client-Side Canvas Heuristics', 
                  desc: 'Local browser context isolates and counts background RGB pixels. Dropping invalid images without a single network roundtrip.',
                  code: 'if (whitePixelCount < 3) throw err;'
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <span className="font-mono text-xs text-neutral-600 mt-1">{item.step}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold uppercase tracking-wide mb-1">{item.title}</h4>
                    <p className="font-mono text-xs text-neutral-400 leading-relaxed mb-3">{item.desc}</p>
                    <div className="bg-black border border-neutral-800 p-3">
                      <pre className="text-[10px] font-mono text-neutral-500"><code>{item.code}</code></pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Module */}
          <div>
            <h2 className="font-mono text-[10px] text-white uppercase tracking-widest mb-6 border-b border-neutral-800 pb-2">Phase 4 Roadmap</h2>
            <div className="border border-neutral-800 p-8 relative flex justify-between items-center bg-black">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white" />
              
              <div className="max-w-sm">
                <h3 className="text-2xl font-bold tracking-tight uppercase mb-3">Spatial Avatars [3D]</h3>
                <p className="font-mono text-[10px] text-neutral-400 leading-relaxed mb-6">
                  Our current pipeline perfects 2D garment transfer. Next, we bridge the spatial gap. We are actively engineering a proprietary 3D mesh wrapper that calculates depth-maps from standard photos, wrapping virtual garments around fully navigable, 360-degree body models.
                </p>
                <div className="flex gap-4 items-center">
                  <span className="px-3 py-1 border border-neutral-700 font-mono text-[9px] uppercase text-neutral-300">Status: Active R&D</span>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                    Orbit Controls (Drag & Zoom)
                  </span>
                </div>
              </div>
              <div className="w-48 h-48 mr-8 flex items-center justify-center relative bg-[#0a0a0a] border border-neutral-800">
                <Brutalist3DModel />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

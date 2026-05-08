import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrialRoomDesktop(props) {
  const {
    activeTab, setActiveTab,
    connectionMode, setConnectionMode, colabUrl, setColabUrl,
    userPhoto, userPhotoUrl, handlePersonFile, poseLoading, isAnalyzing,
    garmentPhoto, selectedGarment, setGarment, garmentDes, setGarmentDes, handleGarmentFile,
    jobStatus, resultUrl, setJobResult, progress, backendStatus,
    handleGenerate, handleDownload, GUIDES, EXAMPLE_GARMENTS
  } = props;

  return (
    <div className="flex flex-row h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-primary/30">
      
      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <div className="w-[420px] border-r border-white/5 bg-[#080808] flex flex-col z-40 shrink-0 relative">
        {props.onBack && (
          <button onClick={props.onBack} className="absolute left-6 top-5 text-[10px] uppercase font-bold text-neutral-500 hover:text-primary transition-all tracking-wider z-10 flex items-center gap-1">
            <span>←</span> SYSTEM BACK
          </button>
        )}
        <div className="flex px-8 py-10 pt-16 items-center gap-4 border-b border-white/5">
          <div className="w-10 h-10 bg-primary text-black flex items-center justify-center font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="font-bold tracking-tighter text-xl uppercase">STUDIO SERIES</h1>
            <p className="font-mono text-[9px] text-primary/60 uppercase tracking-widest">Virtual Trial Room v3.0</p>
          </div>
        </div>

        <div className="flex px-6 py-2 gap-2 border-b border-white/5">
          {['person', 'garment'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-black bg-primary' : 'text-neutral-500 hover:text-white border border-white/5'}`}>
              {tab === 'person' ? '01. MODEL' : '02. GARMENT'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scroll">
          <AnimatePresence mode="wait">
            {activeTab === 'person' ? (
              <motion.div key="person" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-8">
                <div className="space-y-4">
                  <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Target Selection</p>
                  <label className="block p-10 border border-white/10 hover:border-primary/50 transition-all cursor-pointer group text-center bg-white/[0.02] glow-border">
                    <input type="file" className="hidden" accept="image/*" onChange={e => handlePersonFile(e.target.files[0])} />
                    <div className="text-3xl mb-4 group-hover:scale-105 transition-all">📸</div>
                    <p className="font-mono text-xs font-bold uppercase tracking-widest">Upload Input</p>
                    <p className="font-mono text-[9px] text-neutral-500 mt-2 uppercase">Front-facing Required</p>
                  </label>
                </div>

                {userPhotoUrl && (
                  <div className="relative overflow-hidden border border-primary/20 bg-black p-2">
                    <img src={userPhotoUrl} alt="Me" className="w-full aspect-[3/4] object-cover rounded-sm" />
                    {(poseLoading || isAnalyzing) && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                        <div className="font-mono text-xl animate-pulse text-primary">◰</div>
                        <span className="font-mono text-[10px] text-white uppercase tracking-widest">Validating Constraints...</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Heuristics</p>
                  <div className="grid grid-cols-2 gap-4">
                    {GUIDES.person.map(g => (
                      <div key={g.title} className="space-y-2 border border-white/5 p-2 bg-black/50">
                        <div className="relative overflow-hidden aspect-square">
                          <img src={g.img} className="w-full h-full object-cover grayscale opacity-50 hover:opacity-100 transition-all" />
                          <div className={`absolute top-0 left-0 px-2 py-1 text-[8px] font-bold uppercase tracking-widest ${g.status === 'good' ? 'bg-primary text-black' : 'bg-neutral-800 text-white'}`}>
                            {g.status === 'good' ? 'PASS' : 'FAIL'}
                          </div>
                        </div>
                        <p className="font-mono text-[9px] text-neutral-400 leading-relaxed uppercase">{g.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="garment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                <div className="space-y-4">
                  <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Source Material</p>
                  <label className="block p-10 border border-white/10 hover:border-accent/50 transition-all cursor-pointer group text-center bg-white/[0.02] glow-border">
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleGarmentFile(e.target.files[0])} />
                    <div className="text-3xl mb-4 group-hover:scale-105 transition-all">👕</div>
                    <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">{garmentPhoto ? 'Change Material' : 'Upload Material'}</p>
                    <p className="font-mono text-[9px] text-neutral-500 mt-2 uppercase">Flat-lay / Mannequin</p>
                  </label>

                  <div className="space-y-2">
                    <input 
                      type="text"
                      value={garmentDes}
                      onChange={e => setGarmentDes(e.target.value)}
                      placeholder="Garment descriptor (e.g. blue cotton shirt)"
                      className="w-full bg-black border border-white/10 px-4 py-3 font-mono text-[10px] text-white focus:outline-none focus:border-accent transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Internal DB</p>
                  <div className="grid grid-cols-2 gap-4">
                    {EXAMPLE_GARMENTS.map(g => (
                      <button key={g.id} onClick={() => setGarment(g)}
                        className={`group relative overflow-hidden border p-2 transition-all ${selectedGarment?.id === g.id ? 'border-accent bg-accent/10' : 'border-white/5 bg-black hover:border-white/20'}`}>
                        <img src={g.image} className="w-full aspect-square object-cover opacity-70 group-hover:opacity-100 transition-all" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <span className="font-mono text-[10px] font-bold text-white uppercase tracking-widest border border-accent px-2 py-1">Select</span>
                        </div>
                        {selectedGarment?.id === g.id && (
                          <div className="absolute top-2 left-2 bg-accent text-black font-mono px-2 py-1 text-[8px] font-bold uppercase tracking-widest">
                            ACTIVE
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SETTINGS ────────────────────────────────────────────── */}
          <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
            <div>
              <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4">Pipeline Mode</p>
              <div className="flex gap-2 p-1 border border-white/5 bg-black/50">
                {[
                  { id: 'cloud', label: 'Cloud' },
                  { id: 'custom', label: 'Local' },
                  { id: 'mock', label: 'Sim' }
                ].map(mode => (
                  <button 
                    key={mode.id}
                    onClick={() => setConnectionMode(mode.id)}
                    className={`flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-widest transition-all ${connectionMode === mode.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white border border-transparent'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            
            {connectionMode === 'custom' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <input 
                  type="text"
                  value={colabUrl}
                  onChange={e => setColabUrl(e.target.value)}
                  placeholder="LOCAL ENDPOINT URL"
                  className="w-full bg-black border border-white/10 px-4 py-3 font-mono text-[10px] text-white focus:outline-none focus:border-primary transition-all"
                />
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#080808] shrink-0">
          <button
            onClick={handleGenerate}
            disabled={!userPhoto || !selectedGarment || jobStatus === 'pending'}
            className="w-full py-5 btn-brutalist bg-primary text-black disabled:bg-neutral-900 disabled:text-neutral-700 disabled:cursor-not-allowed font-bold text-[10px] uppercase tracking-[0.25em] transition-all border border-primary disabled:border-white/5"
          >
            {jobStatus === 'pending' ? 'EXECUTING INFERENCE...' : 'INITIALIZE PIPELINE'}
          </button>
        </div>
      </div>

      {/* ── MAIN CANVAS ────────────────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-16 overflow-hidden bg-[#020202]">
        
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative w-full max-w-xl aspect-[3/4] border border-white/10 bg-black overflow-hidden flex items-center justify-center shadow-2xl">
          
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary z-10" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary z-10" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary z-10" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary z-10" />

          <AnimatePresence mode="wait">
            {resultUrl ? (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
                <img src={resultUrl} className="w-full h-full object-contain bg-black" alt="Result" />
                <div className="absolute top-6 right-6 flex gap-3">
                  <button onClick={handleDownload}
                    className="group h-12 px-6 bg-primary text-black hover:bg-white flex items-center justify-center gap-3 transition-all border border-primary relative overflow-hidden btn-brutalist">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="inherit">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="font-mono text-[10px] font-bold tracking-widest">EXPORT_FILE</span>
                  </button>
                  <button onClick={() => setJobResult(null, 'idle', null)}
                    className="w-12 h-12 bg-black hover:bg-red-500/10 text-white/50 hover:text-red-500 flex items-center justify-center transition-all border border-white/10 hover:border-red-500/50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black border border-primary font-mono text-[9px] font-bold tracking-[0.2em] text-primary uppercase">
                  RENDER_COMPLETE
                </div>
              </motion.div>
            ) : jobStatus === 'pending' ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-12 text-center w-full max-w-sm">
                <div className="w-full space-y-8">
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-primary/40 uppercase">Process ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-6xl text-white tracking-tighter">{progress}</span>
                      <span className="font-mono text-xl text-primary">%</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="h-[2px] w-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <p className="font-mono text-[9px] text-primary/60 tracking-widest uppercase">
                      &gt; {backendStatus || "INITIATING..."}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12 group flex flex-col items-center">
                <div className="font-mono text-6xl mb-6 text-primary/20 group-hover:text-primary/40 transition-all select-none">[]</div>
                <h2 className="font-mono text-sm tracking-widest text-neutral-500 mb-2 uppercase">RENDER PIPELINE IDLE</h2>
                <p className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">
                  Awaiting inputs...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Indicators */}
        <div className="mt-10 flex gap-8 items-center border border-white/10 px-6 py-3 bg-black shadow-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-none animate-pulse ${connectionMode === 'custom' ? 'bg-accent' : 'bg-primary'}`} />
            <span className="font-mono text-[9px] font-bold text-white/40 uppercase tracking-widest">{connectionMode} LINK</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-bold text-white/40 uppercase tracking-widest">IDM-VTON Core Active</span>
          </div>
        </div>
      </div>

    </div>
  );
}

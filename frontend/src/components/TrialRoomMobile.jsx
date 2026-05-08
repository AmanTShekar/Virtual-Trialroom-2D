import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrialRoomMobile(props) {
  const {
    activeTab, setActiveTab,
    connectionMode, setConnectionMode, colabUrl, setColabUrl,
    userPhoto, userPhotoUrl, handlePersonFile, poseLoading, isAnalyzing,
    garmentPhoto, selectedGarment, setGarment, garmentDes, setGarmentDes, handleGarmentFile,
    jobStatus, resultUrl, setJobResult, progress, backendStatus,
    handleGenerate, handleDownload, GUIDES, EXAMPLE_GARMENTS
  } = props;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#050505] text-white font-sans selection:bg-primary/30 overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="px-5 py-4 flex justify-between items-center z-50 shrink-0 bg-[#080808] border-b border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          {props.onBack && (
            <button onClick={props.onBack} className="font-mono text-[10px] uppercase font-bold text-neutral-500 hover:text-primary transition-colors pb-0.5 tracking-widest">
              ← BACK
            </button>
          )}
          <h1 className="font-bold tracking-tighter text-sm uppercase">STUDIO SERIES</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-none animate-pulse ${connectionMode === 'custom' ? 'bg-accent' : 'bg-primary'}`} />
          <span className="font-mono text-[9px] font-bold text-white/40 uppercase tracking-wider">{connectionMode}</span>
        </div>
      </div>

      {/* TOP CANVAS (Fixed Size) */}
      <div className="relative w-full aspect-[3/4] bg-[#020202] overflow-hidden shrink-0 border-b border-white/10 shadow-inner">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 0)', backgroundSize: '30px 30px' }} />

        <AnimatePresence mode="wait">
          {resultUrl ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative">
              <img src={resultUrl} className="w-full h-full object-contain bg-black" alt="Result" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleDownload}
                  className="w-10 h-10 bg-primary text-black flex items-center justify-center border border-primary active:scale-95 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button onClick={() => setJobResult(null, 'idle', null)}
                  className="w-10 h-10 bg-black/80 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black border border-primary font-mono text-[8px] font-bold tracking-[0.2em] text-primary uppercase">
                RENDER_COMPLETE
              </div>
            </motion.div>
          ) : jobStatus === 'pending' ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-full max-w-[200px] space-y-6">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-primary/40 uppercase">Processing</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-6xl text-white tracking-tighter">{progress}</span>
                    <span className="font-mono text-lg text-primary">%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-[2px] w-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                  </div>
                  <p className="font-mono text-[10px] text-primary/60 font-medium tracking-wide uppercase">
                    &gt; {backendStatus || "INITIATING..."}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="font-mono text-5xl mb-4 text-primary/10">[]</div>
              <h2 className="font-mono text-sm tracking-widest text-neutral-500 mb-2 uppercase">RENDER PIPELINE IDLE</h2>
              <p className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">
                Select inputs below
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM SHEET (Scrollable) */}
      <div className="flex-1 flex flex-col bg-[#080808] relative z-40 overflow-hidden border-t border-white/5">
        
        {/* TABS */}
        <div className="flex px-4 py-2 border-b border-white/5 shrink-0 gap-2 bg-[#0a0a0a]">
          {['person', 'garment'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 font-mono text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'text-neutral-500 border border-white/5'}`}>
              {tab === 'person' ? '01. MODEL' : '02. GARMENT'}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-28 custom-scroll">
          <AnimatePresence mode="wait">
            {activeTab === 'person' ? (
              <motion.div key="person" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                
                {userPhotoUrl && (
                  <div className="relative overflow-hidden border border-primary/20 aspect-[3/4] w-48 mx-auto bg-black p-1 shadow-2xl">
                    <img src={userPhotoUrl} alt="Me" className="w-full h-full object-cover rounded-sm" />
                    {(poseLoading || isAnalyzing) && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                        <div className="font-mono text-xl animate-pulse text-primary">◰</div>
                      </div>
                    )}
                  </div>
                )}

                <label className="block p-8 border border-white/10 bg-white/[0.02] text-center active:scale-[0.98] transition-all cursor-pointer glow-border">
                  <input type="file" className="hidden" accept="image/*" onChange={e => handlePersonFile(e.target.files[0])} />
                  <div className="text-2xl mb-2">📸</div>
                  <p className="font-mono text-xs font-bold uppercase tracking-widest">{userPhoto ? 'CHANGE INPUT' : 'UPLOAD INPUT'}</p>
                </label>

                <div className="space-y-3">
                  <p className="font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Heuristics</p>
                  <div className="flex gap-3">
                    {GUIDES.person.map(g => (
                      <div key={g.title} className="flex-1 space-y-2 border border-white/5 bg-black p-1">
                        <div className="relative overflow-hidden aspect-square">
                          <img src={g.img} className="w-full h-full object-cover grayscale opacity-60" />
                          <div className={`absolute top-0 left-0 px-1.5 py-0.5 text-[7px] font-bold uppercase ${g.status === 'good' ? 'bg-primary text-black' : 'bg-neutral-800 text-white'}`}>
                            {g.status === 'good' ? 'PASS' : 'FAIL'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div key="garment" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                
                {selectedGarment && (
                  <div className="flex items-center gap-4 p-4 bg-black border border-accent/20 shadow-[0_0_15px_rgba(188,254,47,0.05)]">
                    <div className="w-16 h-16 bg-neutral-900 border border-accent/20 shrink-0 p-1">
                      <img src={selectedGarment.image} className="w-full h-full object-cover rounded-sm" alt="Selected" />
                    </div>
                    <div className="flex-1">
                      <p className="font-mono text-[9px] text-accent/60 font-bold uppercase tracking-widest mb-1">Active Material</p>
                      <p className="font-mono text-xs font-bold text-white truncate uppercase">{selectedGarment.name}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-6 border border-white/10 bg-white/[0.02] text-center active:scale-[0.98] transition-all cursor-pointer glow-border">
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleGarmentFile(e.target.files[0])} />
                    <div className="text-2xl mb-2">👕</div>
                    <p className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest">Upload Custom</p>
                  </label>
                  
                  <div className="flex flex-col justify-center space-y-2">
                    <input 
                      type="text"
                      value={garmentDes}
                      onChange={e => setGarmentDes(e.target.value)}
                      placeholder="DESCRIPTOR..."
                      className="w-full bg-black border border-white/10 px-4 py-3 font-mono text-[10px] text-white focus:outline-none focus:border-accent transition-all uppercase"
                    />
                    <p className="font-mono text-[8px] text-neutral-500 text-center uppercase tracking-widest">Fabric Classifier</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Internal DB</p>
                  <div className="grid grid-cols-2 gap-3">
                    {EXAMPLE_GARMENTS.map(g => (
                      <button key={g.id} onClick={() => setGarment(g)}
                        className={`relative aspect-square overflow-hidden border p-1 transition-all ${selectedGarment?.id === g.id ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(188,254,47,0.1)]' : 'border-white/5 bg-black'}`}>
                        <img src={g.image} className="w-full h-full object-cover opacity-70 transition-all" />
                        {selectedGarment?.id === g.id && (
                          <div className="absolute top-1 left-1 bg-accent text-black px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest">ACTIVE</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                   <p className="font-mono text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Pipeline Mode</p>
                   <div className="flex gap-2 p-1 border border-white/5 bg-black/50">
                      {[{ id: 'cloud', label: 'Cloud' }, { id: 'custom', label: 'Local' }, { id: 'mock', label: 'Sim' }].map(m => (
                        <button key={m.id} onClick={() => setConnectionMode(m.id)}
                          className={`flex-1 py-2 font-mono text-[9px] font-bold uppercase tracking-widest transition-all ${connectionMode === m.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white border border-transparent'}`}>
                          {m.label}
                        </button>
                      ))}
                   </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FLOATING ACTION BUTTON */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#080808] border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <button
            onClick={handleGenerate}
            disabled={!userPhoto || !selectedGarment || jobStatus === 'pending'}
            className="w-full py-5 btn-brutalist bg-primary text-black disabled:bg-neutral-900 disabled:text-neutral-700 disabled:cursor-not-allowed font-bold text-[10px] uppercase tracking-[0.25em] transition-all border border-primary disabled:border-white/5"
          >
            {jobStatus === 'pending' ? 'EXECUTING INFERENCE...' : 'INITIALIZE PIPELINE'}
          </button>
        </div>

      </div>
    </div>
  );
}

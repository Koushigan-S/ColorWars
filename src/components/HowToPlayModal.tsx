import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Zap, ShieldAlert, Trophy, ChevronRight, ChevronLeft } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'critical' | 'explosions' | 'victory'>('rules');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-panel-heavy w-full max-w-xl max-h-[90vh] rounded-3xl relative overflow-hidden border border-white/10 shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  How to Play ColorWars?!
                </h2>
                <p className="text-xs text-gray-400">Master the rules of chain reaction conquest</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation Controls */}
          <div className="grid grid-cols-4 p-2 bg-slate-900/60 border-b border-white/5 gap-1">
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'rules'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              1. Basics
            </button>

            <button
              onClick={() => setActiveTab('critical')}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'critical'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              2. Capacity
            </button>

            <button
              onClick={() => setActiveTab('explosions')}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'explosions'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              3. Chain
            </button>

            <button
              onClick={() => setActiveTab('victory')}
              className={`py-2 px-1 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'victory'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              4. Victory
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-300 custom-scrollbar">
            {/* TAB 1: BASICS */}
            {activeTab === 'rules' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> Turn-Based Color Conquest
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-300">
                    ColorWars is a 2-player strategic battle on a 5x5 grid. Player 1 commands <span className="text-game-red font-bold">RED 🔴</span> and Player 2 commands <span className="text-game-blue font-bold">BLUE 🔵</span>.
                  </p>
                </div>

                {/* Visual Diagram 1: Placing Orbs */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center gap-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Visual Demo: Placing Atom Orbs
                  </span>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Empty cell */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <span className="text-[10px] text-gray-500 font-mono">Empty</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Tap Empty Cell</span>
                    </div>

                    {/* 1 Orb cell */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-16 h-16 rounded-xl bg-red-950/60 border border-game-red/40 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 shadow-[0_0_10px_#ef4444] border border-white/40" />
                      </div>
                      <span className="text-[10px] text-game-red font-bold">1 Red Orb</span>
                    </div>

                    {/* 2 Orbs cell */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-16 h-16 rounded-xl bg-red-950/60 border border-game-red/40 flex items-center justify-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 shadow-[0_0_8px_#ef4444]" />
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 shadow-[0_0_8px_#ef4444]" />
                      </div>
                      <span className="text-[10px] text-game-red font-bold">2 Orbs</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 max-w-md">
                    On your turn, tap any empty cell or a cell you already control to add 1 orb of your color.
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB 2: CRITICAL MASS CAPACITY */}
            {activeTab === 'critical' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" /> Critical Mass Rules
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-300">
                    Every cell on the board has a maximum capacity before it <span className="text-amber-400 font-bold uppercase">explodes</span> based on how many adjacent cells it touches:
                  </p>
                </div>

                {/* Critical Mass Visual Graphic Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Corner Rule */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/30 flex flex-col items-center text-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                      4 Corners
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-amber-500 flex flex-col items-center justify-center">
                      <span className="font-mono text-lg font-black text-amber-400">2</span>
                      <span className="text-[8px] text-gray-400 uppercase">Max 1</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-tight">
                      Explodes at <strong className="text-amber-400">2 Orbs</strong>
                    </p>
                  </div>

                  {/* Edge Rule */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/30 flex flex-col items-center text-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase">
                      12 Edges
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-cyan-500 flex flex-col items-center justify-center">
                      <span className="font-mono text-lg font-black text-cyan-400">3</span>
                      <span className="text-[8px] text-gray-400 uppercase">Max 2</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-tight">
                      Explodes at <strong className="text-cyan-400">3 Orbs</strong>
                    </p>
                  </div>

                  {/* Middle Rule */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 flex flex-col items-center text-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-black uppercase">
                      9 Middle
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-purple-500 flex flex-col items-center justify-center">
                      <span className="font-mono text-lg font-black text-purple-400">4</span>
                      <span className="text-[8px] text-gray-400 uppercase">Max 3</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-tight">
                      Explodes at <strong className="text-purple-400">4 Orbs</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 text-center font-medium">
                  💡 <strong>Pro Tip:</strong> Corner cells are easiest to explode (require only 2 orbs) and are great for triggering early chain reactions!
                </div>
              </motion.div>
            )}

            {/* TAB 3: CHAIN REACTION & CONQUEST */}
            {activeTab === 'explosions' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    💥 Explosions & Territory Capture
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-300">
                    When a cell reaches Critical Mass, it explodes! Its orbs shoot outward to all adjacent cells (North, South, East, West).
                  </p>
                </div>

                {/* Visual Diagram: Before & After Explosion */}
                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block text-center">
                    Visual Demo: Capturing Enemy Territory
                  </span>

                  <div className="grid grid-cols-2 gap-4 items-center">
                    {/* Before */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-white/5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Before Explosion</span>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg">
                        <div className="w-8 h-8 rounded bg-slate-900" />
                        <div className="w-8 h-8 rounded bg-blue-950/80 border border-blue-500 flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                        </div>
                        <div className="w-8 h-8 rounded bg-slate-900" />
                        <div className="w-8 h-8 rounded bg-slate-900" />
                        {/* Exploding Red Cell */}
                        <div className="w-8 h-8 rounded bg-red-950 border border-red-500 flex items-center justify-center animate-pulse">
                          <span className="text-xs font-mono font-black text-game-red">3/3</span>
                        </div>
                        <div className="w-8 h-8 rounded bg-slate-900" />
                      </div>
                      <span className="text-[9px] text-gray-400 text-center">Red adds 3rd orb to Edge</span>
                    </div>

                    {/* After */}
                    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">After Explosion</span>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg">
                        <div className="w-8 h-8 rounded bg-slate-900" />
                        {/* Converted Blue to Red Cell */}
                        <div className="w-8 h-8 rounded bg-red-950 border border-red-500 flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
                        </div>
                        <div className="w-8 h-8 rounded bg-slate-900" />
                        <div className="w-8 h-8 rounded bg-red-950/50 border border-red-500/50 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                        {/* Emptied Exploded Cell */}
                        <div className="w-8 h-8 rounded bg-slate-900 border border-amber-500/50 flex items-center justify-center">
                          <span className="text-[8px] text-amber-400 font-bold">BANG!</span>
                        </div>
                        <div className="w-8 h-8 rounded bg-red-950/50 border border-red-500/50 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                      </div>
                      <span className="text-[9px] text-emerald-400 text-center font-bold">Enemy Blue cell converted to Red!</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: VICTORY */}
            {activeTab === 'victory' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    How to Win the Match
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-300 max-w-md mx-auto">
                    A player wins the match when they successfully <span className="text-game-red font-bold">wipe out all opponent orbs</span> from the board through cascading chain reaction explosions!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    ⚡ Key Summary Rules:
                  </h4>
                  <ul className="space-y-1.5 text-gray-300 list-disc list-inside">
                    <li>Corners explode at <strong>2 orbs</strong></li>
                    <li>Edges explode at <strong>3 orbs</strong></li>
                    <li>Middle cells explode at <strong>4 orbs</strong></li>
                    <li>Explosions instantly convert any enemy cells hit into your color.</li>
                    <li>Wipe out all enemy pieces to win!</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-white/10 bg-slate-950/90 flex items-center justify-between">
            <button
              onClick={() => {
                if (activeTab === 'critical') setActiveTab('rules');
                else if (activeTab === 'explosions') setActiveTab('critical');
                else if (activeTab === 'victory') setActiveTab('explosions');
              }}
              disabled={activeTab === 'rules'}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-1.5">
              {(['rules', 'critical', 'explosions', 'victory'] as const).map((tab) => (
                <span
                  key={tab}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeTab === tab ? 'w-5 bg-amber-400' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {activeTab !== 'victory' ? (
              <button
                onClick={() => {
                  if (activeTab === 'rules') setActiveTab('critical');
                  else if (activeTab === 'critical') setActiveTab('explosions');
                  else if (activeTab === 'explosions') setActiveTab('victory');
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-md"
              >
                Next <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Got It! Play Now
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default HowToPlayModal;

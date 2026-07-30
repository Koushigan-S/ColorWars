import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useDrawer } from '../contexts/DrawerContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Plus, ArrowRight, X, HelpCircle, Zap, Target, Award, Users } from 'lucide-react';

export const Home: React.FC = () => {
  const { createRoom, joinRoom } = useGame();
  const { profile, signOut } = useAuth();
  const { openDrawer } = useDrawer();
  const navigate = useNavigate();

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      await createRoom();
    } catch (e: any) {
      console.error(e);
      setError(`Failed to create room: [${e.code || 'unknown-error'}] - ${e.message || 'Please check your configuration.'}`);
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length !== 6) {
      setError('Room code must be exactly 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await joinRoom(roomCode.trim());
    } catch (e: any) {
      setError(e.message || 'Failed to join room. Please check the code.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-4 bg-[#02040a]">
      {/* Background glow meshes */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      {/* Floating profile link in the top corner */}
      {profile && (
        <div className="absolute top-6 right-6 flex items-center gap-4 z-40">
          <button
            onClick={() => navigate(`/profile/${profile.uid}`)}
            className="flex items-center gap-2.5 p-1.5 pr-4 glass-panel hover:bg-white/5 rounded-full border border-white/10 transition-all hover:scale-105 cursor-pointer active:scale-95 group"
          >
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-8 h-8 rounded-full border border-white/20 group-hover:border-white/50 object-cover"
            />
            <span className="text-sm font-semibold text-gray-200 group-hover:text-white hidden sm:inline">
              Profile
            </span>
          </button>

          <button
            onClick={signOut}
            className="text-xs font-semibold text-gray-500 hover:text-game-red transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Minimal Logo */}
      <div className="mb-10 text-center pointer-events-none flex flex-col items-center">
        <img src="/favicon.png" alt="ColorWars Logo" className="w-20 h-20 mb-4 object-contain shadow-lg" />
        <h1 className="font-display text-4xl font-black text-white tracking-tight uppercase leading-none">
          WAR <span className="text-game-red">ZONE</span>
        </h1>
        <p className="text-[10px] text-gray-500 tracking-[0.25em] uppercase font-bold mt-1">
          Red vs Blue Territory Conquest
        </p>
      </div>

      {/* Central Action Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-4 z-10">
        {/* Create Room Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateRoom}
          disabled={loading}
          className="relative glass-panel group p-6 rounded-2xl flex items-center justify-between transition-all border border-white/10 hover:border-game-red/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-game-red/10 border border-game-red/30 text-game-red group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="font-display text-lg font-bold text-white group-hover:text-game-red transition-colors">
                Create Room
              </h2>
              <p className="text-xs text-gray-400">Host a new real-time game</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-game-red group-hover:translate-x-1 transition-all" />
        </motion.button>

        {/* Join Room Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsJoinModalOpen(true);
            setError(null);
          }}
          disabled={loading}
          className="relative glass-panel group p-6 rounded-2xl flex items-center justify-between transition-all border border-white/10 hover:border-game-blue/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-game-blue/10 border border-game-blue/30 text-game-blue group-hover:scale-110 transition-transform">
              <Swords className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="font-display text-lg font-bold text-white group-hover:text-game-blue transition-colors">
                Join Room
              </h2>
              <p className="text-xs text-gray-400">Enter a 6-character room code</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-game-blue group-hover:translate-x-1 transition-all" />
        </motion.button>

        {/* How to play?! Button (Placed directly below Join Room) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsHowToPlayOpen(true)}
          disabled={loading}
          className="relative glass-panel group p-6 rounded-2xl flex items-center justify-between transition-all border border-white/10 hover:border-amber-400/40 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="font-display text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                How to play?!
              </h2>
              <p className="text-xs text-gray-400">Rules, explosions & chain reactions</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
        </motion.button>

        {/* Friends Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openDrawer}
          className="relative glass-panel group p-6 rounded-2xl flex items-center justify-between transition-all border border-white/10 hover:border-indigo-400/40 hover:shadow-[0_0_30px_rgba(129,140,248,0.15)] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="font-display text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                Friends
              </h2>
              <p className="text-xs text-gray-400">Search, invite & chat with players</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-game-red/10 border border-game-red/20 text-game-red text-xs text-center font-medium max-w-sm w-full"
        >
          {error}
        </motion.div>
      )}

      {/* Join Room Modal */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!loading) setIsJoinModalOpen(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="glass-panel-heavy w-full max-w-sm p-6 rounded-3xl relative overflow-hidden border border-white/10 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">
                  Join Game Room
                </h3>
                <button
                  onClick={() => setIsJoinModalOpen(false)}
                  disabled={loading}
                  className="p-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1.5">
                    Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="E.G. A4XF2P"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    disabled={loading}
                    className="w-full text-center uppercase font-mono font-bold tracking-widest text-2xl py-3 px-4 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-game-blue focus:ring-1 focus:ring-game-blue transition-all"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-game-red text-xs text-center font-medium mt-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || roomCode.length !== 6}
                  className="w-full bg-game-blue hover:bg-game-blue-hover text-white font-semibold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    'Enter Battle'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOW TO PLAY MODAL TAB */}
      <AnimatePresence>
        {isHowToPlayOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHowToPlayOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md rounded-3xl bg-[#0d1527] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-white tracking-wide uppercase">
                      How to Play
                    </h3>
                    <p className="text-xs text-slate-400">Rules & Strategy Guide</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsHowToPlayOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guide Content Body */}
              <div className="p-5 space-y-4 text-xs text-slate-300 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {/* 1. Placement */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-game-red" /> 1. Turn-Based Placement
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Take turns placing energy orbs on a 5x5 board. Tap any empty cell to claim it, or tap your own cell to stack orbs.
                  </p>
                </div>

                {/* 2. Critical Mass */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> 2. Critical Mass Rules
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-amber-400 font-mono font-black text-lg block">2 Orbs</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Corners</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-amber-400 font-mono font-black text-lg block">3 Orbs</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Edges</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                      <span className="text-amber-400 font-mono font-black text-lg block">4 Orbs</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Center</span>
                    </div>
                  </div>
                </div>

                {/* 3. Explosions */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    💥 3. Explosions & Chain Reactions
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Reaching critical mass causes an explosion! Orbs split into adjacent neighboring cells, converting opponent orbs to your color and triggering chain reactions.
                  </p>
                </div>

                {/* 4. Victory */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-game-blue" /> 4. Winning the Match
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    Eliminate all of your opponent's cells from the board to claim ultimate victory!
                  </p>
                </div>
              </div>

              {/* Footer Button */}
              <div className="p-4 border-t border-white/10 bg-slate-900/90 text-center">
                <button
                  onClick={() => setIsHowToPlayOpen(false)}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
                >
                  Got It!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;

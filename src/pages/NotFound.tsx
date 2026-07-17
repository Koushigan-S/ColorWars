import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center p-4 bg-[#02040a] text-center">
      {/* Background glow meshes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-game-red/5 blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-8 rounded-3xl max-w-sm w-full border border-white/5 shadow-2xl relative"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-game-red"></div>

        <div className="p-4 bg-game-red/10 border border-game-red/20 rounded-full inline-flex text-game-red mb-6 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="font-display text-4xl font-black text-white mb-2">404</h1>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Battlefield Not Found</h2>
        <p className="text-xs text-gray-500 mb-8 leading-relaxed">
          The coordinate grid sector you are trying to reach does not exist or has been destroyed.
        </p>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 hover:bg-gray-100 py-3 rounded-xl font-bold transition-all cursor-pointer active:scale-98"
        >
          <ArrowLeft className="w-4 h-4 text-slate-950" />
          <span>Return to base</span>
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;

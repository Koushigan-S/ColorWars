import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070f]">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-game-red/10 blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-game-blue/10 blur-[100px] animate-pulse-slow"></div>

      <div className="relative flex flex-col items-center">
        {/* Spinning Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-16 h-16 border-4 border-game-red border-t-game-blue rounded-full filter drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]"
        ></motion.div>

        {/* Text Loader */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center"
        >
          <h2 className="font-display text-xl font-bold tracking-wider text-white uppercase">
            RED <span className="text-gray-400">vs</span> BLUE
          </h2>
          <p className="mt-1 text-xs text-gray-500 tracking-widest uppercase animate-pulse">
            Connecting to battlefield...
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;

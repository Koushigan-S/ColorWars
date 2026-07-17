import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroScreenProps {
  onComplete: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 50ms interval * 100 steps = 5000ms (5 seconds total duration).
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(onComplete, 500); // Complete after fade-out transition
          }, 300);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFadingOut && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#ef5252] to-[#3b82f6] select-none pointer-events-none"
        >
          {/* Subtle background gradient ambient glows */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#ef5252]/10 blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#3b82f6]/10 blur-[80px]" />

          <div className="flex flex-col items-center justify-center max-w-sm px-6 text-center">
            {/* Logo Zoom-in Spring Animation */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 85,
                damping: 14,
                duration: 1.5,
              }}
              className="relative w-36 h-36 flex items-center justify-center bg-[#fcf4e8] rounded-[36px] shadow-2xl border border-[#cfc0ae]/30 mb-8 p-4"
            >
              <motion.img
                src="/logo.png"
                alt="ColorWars Logo"
                className="w-full h-full object-contain filter drop-shadow-md"
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: 'linear',
                }}
              />
            </motion.div>

            {/* Game Title Text */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <h1 className="font-display font-black text-3xl text-white uppercase tracking-tighter leading-none mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                Color Wars
              </h1>
              <p className="text-[10px] font-black uppercase text-white/80 tracking-[0.25em] mb-12">
                Red or Blue - The Challenge
              </p>
            </motion.div>
          </div>

          {/* Preloader at the bottom */}
          <div className="absolute bottom-16 flex flex-col items-center w-64">
            <div className="flex justify-between w-full mb-2 px-1 text-[10px] font-black uppercase tracking-wider text-white/90">
              <span>Loading Battlefield</span>
              <span className="font-mono text-xs">{progress}%</span>
            </div>

            {/* Styled progress track */}
            <div className="w-full h-2.5 bg-[#d6c5b2] rounded-full p-0.5 shadow-inner border border-[#cfc0ae]/20 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#ef5252] to-[#3b82f6] rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroScreen;

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(false);
    setError(null);
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(`Authentication Error: [${err.code || 'unknown-error'}] - ${err.message || 'Please check your connection.'}`);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center p-4 bg-[#02040a]">
      {/* Visual background elements */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-game-red/10 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-game-blue/10 blur-[120px] animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl text-center relative overflow-hidden shadow-2xl"
      >
        {/* Glow board borders */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-game-red via-purple-500 to-game-blue"></div>

        {/* Game Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative w-20 h-20 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center justify-center">
            <img src="/favicon.png" alt="ColorWars Logo" className="w-14 h-14 object-contain" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-game-red to-game-blue opacity-30 blur-sm -z-10 animate-pulse"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2 leading-none">
          RED <span className="text-gray-400">vs</span> BLUE
        </h1>
        <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-8">
          The Real-Time Color War
        </p>

        {/* Description / Rules */}
        <div className="glass-panel-light p-4 rounded-xl text-left text-xs text-gray-400 mb-8 space-y-2 border border-white/5">
          <p className="font-bold text-white uppercase text-center mb-1 border-b border-white/5 pb-1">Battle Instructions</p>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-game-red mt-1"></span>
            <p><strong>Cloning:</strong> Select a tile and click a 1-step neighbor cell to clone your piece.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-game-blue mt-1"></span>
            <p><strong>Jumping:</strong> Select a tile and click a 2-step cell to jump your piece across the board.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 mt-1"></span>
            <p><strong>Conquest:</strong> Landing adjacent to enemy tiles flips them to your color!</p>
          </div>
        </div>

        {/* Authentication Action */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-950 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
        </button>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-game-red text-xs mt-4 font-medium"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default Login;

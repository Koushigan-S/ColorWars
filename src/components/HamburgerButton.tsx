import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface HamburgerButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const HamburgerButton: React.FC<HamburgerButtonProps> = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Hide hamburger menu while logging in or when user is not authenticated
  if (!user || location.pathname === '/login') {
    return null;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onToggle}
      aria-label="Toggle Friends Menu"
      className="fixed top-5 left-5 z-50 p-3 rounded-2xl flex items-center justify-center transition-all shadow-xl backdrop-blur-xl border cursor-pointer select-none group bg-slate-900/90 border-white/10 hover:border-indigo-500/40"
    >
      <div className="relative flex items-center justify-center">
        {isOpen ? (
          <X className="w-5 h-5 text-white transition-transform duration-300" />
        ) : (
          <Menu className="w-5 h-5 text-indigo-400 transition-transform duration-300 group-hover:rotate-90" />
        )}
      </div>
    </motion.button>
  );
};

export default HamburgerButton;

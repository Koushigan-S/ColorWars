import React from 'react';
import { useFriends } from '../contexts/FriendsContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Check, X, XCircle } from 'lucide-react';

export const GameInviteToast: React.FC = () => {
  const { incomingInvite, respondToInvite, rejectedInviteFeedback, clearRejectedFeedback } = useFriends();
  const navigate = useNavigate();

  const handleAccept = async () => {
    if (!incomingInvite) return;
    const roomCode = incomingInvite.roomCode;
    await respondToInvite(incomingInvite.id, true);
    navigate(`/room/${roomCode}`);
  };

  const handleReject = async () => {
    if (!incomingInvite) return;
    await respondToInvite(incomingInvite.id, false);
  };

  return (
    <>
      {/* 1. Receiver Incoming Game Invite Banner (Accept / Reject) */}
      <AnimatePresence>
        {incomingInvite && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="p-4 rounded-2xl bg-slate-900/95 border border-indigo-500/50 shadow-[0_10px_35px_rgba(99,102,241,0.4)] backdrop-blur-xl flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <img
                  src={incomingInvite.senderPhoto}
                  alt={incomingInvite.senderName}
                  className="w-10 h-10 rounded-full border-2 border-indigo-400 object-cover"
                />
                <div>
                  <h4 className="font-display font-black text-xs text-white truncate max-w-[140px]">
                    {incomingInvite.senderName}
                  </h4>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Swords className="w-3 h-3 text-amber-400" /> Invited you to play!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAccept}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95 border-none"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Accept
                </button>

                <button
                  onClick={handleReject}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Sender Rejection Feedback Toast */}
      <AnimatePresence>
        {rejectedInviteFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="p-4 rounded-2xl bg-red-950/90 border border-red-500/50 shadow-[0_10px_35px_rgba(239,68,68,0.3)] backdrop-blur-xl flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <h4 className="font-display font-black text-xs text-white">
                    Invite Rejected
                  </h4>
                  <p className="text-[10px] text-red-200">
                    {rejectedInviteFeedback.friendName} rejected your game invite.
                  </p>
                </div>
              </div>

              <button
                onClick={clearRejectedFeedback}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GameInviteToast;

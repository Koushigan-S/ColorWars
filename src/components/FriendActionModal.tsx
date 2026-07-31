import React, { useState } from 'react';
import { useFriends } from '../contexts/FriendsContext';
import { useGame } from '../contexts/GameContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, getEffectiveStatus } from '../utils/friendCode';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, MessageSquare, User, X, UserX } from 'lucide-react';

export const FriendActionModal: React.FC = () => {
  const { selectedFriend, setSelectedFriend, sendGameInvite, setActiveChatFriend, removeFriend } = useFriends();
  const { createRoom, activeRoom } = useGame();
  const navigate = useNavigate();

  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  if (!selectedFriend) return null;

  const handleInvite = async () => {
    setInviting(true);
    try {
      let roomCode = activeRoom?.id;
      if (!roomCode) {
        // Create new room code
        await createRoom();
        roomCode = activeRoom?.id;
      }
      if (roomCode) {
        await sendGameInvite(selectedFriend.uid, roomCode);
        setInviteSuccess(true);
        setTimeout(() => setInviteSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInviting(false);
    }
  };

  const handleOpenChat = () => {
    setActiveChatFriend(selectedFriend);
    setSelectedFriend(null);
  };

  const handleViewProfile = () => {
    navigate(`/profile/${selectedFriend.uid}`);
    setSelectedFriend(null);
  };

  // Online status calculation using getEffectiveStatus
  const effStatus = getEffectiveStatus(selectedFriend);
  const isOnline = effStatus === 'online';
  const isInGame = effStatus === 'in-game';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedFriend(null)}
          className="absolute inset-0 bg-black/75 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-sm rounded-3xl bg-[#0f172a] border border-white/10 shadow-2xl relative overflow-hidden text-center z-10 p-6 flex flex-col items-center"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedFriend(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Profile Avatar with status ring */}
          <div className="relative mb-4 mt-2">
            <img
              src={selectedFriend.photoURL}
              alt={selectedFriend.displayName}
              className="w-20 h-20 rounded-full border-4 border-slate-800 shadow-xl object-cover"
            />
            {/* Status indicator */}
            <span
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#0f172a] ${
                isInGame
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : isOnline
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Display Name (Google Account Name) */}
          <h2 className="font-display text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            {selectedFriend.displayName}
          </h2>

          {/* Status Badge */}
          <div className="mt-1 flex items-center gap-1.5 justify-center">
            {isInGame ? (
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Swords className="w-3.5 h-3.5" /> In Game
              </span>
            ) : isOnline ? (
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                ● Online
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                Offline ({formatRelativeTime(selectedFriend.lastSeen)})
              </span>
            )}
          </div>

          {/* Action Buttons Grid */}
          <div className="w-full grid grid-cols-3 gap-3 mt-6">
            {/* Invite Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleInvite}
              disabled={inviting}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Swords className="w-6 h-6 mb-1 text-indigo-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                {inviting ? 'Sending...' : inviteSuccess ? 'Sent!' : 'Invite'}
              </span>
            </motion.button>

            {/* Message Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenChat}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all cursor-pointer shadow-md"
            >
              <MessageSquare className="w-6 h-6 mb-1 text-cyan-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">Message</span>
            </motion.button>

            {/* View Profile Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewProfile}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white transition-all cursor-pointer shadow-md"
            >
              <User className="w-6 h-6 mb-1 text-purple-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">Profile</span>
            </motion.button>
          </div>

          {/* Remove Friend button */}
          <button
            onClick={() => removeFriend(selectedFriend.uid)}
            className="mt-6 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1 opacity-70 hover:opacity-100 transition-all cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5" /> Remove Friend
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FriendActionModal;

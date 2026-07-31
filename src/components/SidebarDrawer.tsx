import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFriends } from '../contexts/FriendsContext';
import { useLocation } from 'react-router-dom';
import { formatRelativeTime, getEffectiveStatus } from '../utils/friendCode';
import type { UserProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  UserPlus,
  Check,
  Swords,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const {
    friendsList,
    pendingRequests,
    setSelectedFriend,
    searchUsersByQuery,
    sendFriendRequestByUsername,
    acceptFriendRequest,
    declineFriendRequest,
  } = useFriends();

  const [friendsSubTab, setFriendsSubTab] = useState<'all' | 'requests'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [addingTarget, setAddingTarget] = useState<string | null>(null);

  // Optimized real-time search effect as user types in the search bar
  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setAddFeedback(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsersByQuery(searchInput.trim());
      setSearchResults(results);
      setSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Hide drawer while logging in or when user is not authenticated
  if (!user || location.pathname === '/login') {
    return null;
  }

  const handleAddFriend = async (targetName: string) => {
    setAddingTarget(targetName);
    setAddFeedback(null);

    const result = await sendFriendRequestByUsername(targetName);
    setAddFeedback(result);
    setAddingTarget(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity cursor-pointer"
          />

          {/* Sliding Sidebar Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed left-0 top-0 bottom-0 w-full max-w-sm z-50 flex flex-col shadow-2xl overflow-hidden border-r border-white/10 bg-[#0b1329]"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-black text-base text-white tracking-tight uppercase">
                    FRIENDS MENU
                  </h2>
                  <p className="text-[10px] text-indigo-300 font-semibold uppercase">ColorWars Community</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB CONTENT: FRIENDS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Clean Search Input (Optimized search as you type) */}
              <div className="flex flex-col gap-2">
                <div className="relative flex items-center">
                  <input
                    id="friend-search-input"
                    name="friendSearch"
                    type="text"
                    placeholder="Search Google Account Name (e.g. Arjun)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                </div>

                {/* SEARCH RESULTS LIST (Shown dynamically below search bar) */}
                {searching && (
                  <div className="p-3 rounded-2xl bg-black/20 border border-white/5 text-center text-xs text-slate-400">
                    Searching players...
                  </div>
                )}

                {!searching && searchInput.trim() && searchResults.length === 0 && (
                  <div className="p-3 rounded-2xl bg-black/20 border border-white/5 text-center text-xs text-slate-400">
                    No player found matching "{searchInput.trim()}"
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                    {searchResults.map((searchedUser) => {
                      const effStatus = getEffectiveStatus(searchedUser);
                      const isOnline = effStatus === 'online';
                      const isInGame = effStatus === 'in-game';

                      return (
                        <motion.div
                          key={searchedUser.uid}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-md"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="relative">
                              <img
                                src={searchedUser.photoURL}
                                alt={searchedUser.displayName}
                                className="w-10 h-10 rounded-full border border-indigo-400/50 object-cover"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-slate-900 ${
                                  isInGame
                                    ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                                    : isOnline
                                    ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                                    : 'bg-slate-500'
                                }`}
                              />
                            </div>

                            <div className="truncate">
                              <span className="block text-xs font-bold text-white truncate">
                                {searchedUser.displayName}
                              </span>
                              {isInGame ? (
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                  <Swords className="w-3 h-3" /> In Game
                                </span>
                              ) : isOnline ? (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                  ● Online
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Offline ({formatRelativeTime(searchedUser.lastSeen)})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ADD OPTION NEXT TO SEARCHED PROFILE */}
                          {searchedUser.uid === user?.uid ? (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-white/5 rounded-lg">
                              You
                            </span>
                          ) : profile?.friends?.includes(searchedUser.uid) ? (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                              Friends
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddFriend(searchedUser.displayName)}
                              disabled={addingTarget === searchedUser.displayName}
                              className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center gap-1 active:scale-95 flex-shrink-0"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>
                                {addingTarget === searchedUser.displayName ? '...' : 'Add Friend'}
                              </span>
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {addFeedback && (
                  <p className={`text-xs font-bold px-1 flex items-center gap-1 ${addFeedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {addFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {addFeedback.message}
                  </p>
                )}
              </div>

              {/* Sub-toggle Control: All Friends vs Requests */}
              <div className="flex items-center justify-between p-1 rounded-xl bg-black/25 border border-white/5">
                <button
                  onClick={() => setFriendsSubTab('all')}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    friendsSubTab === 'all'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Friends ({friendsList.length})
                </button>

                <button
                  onClick={() => setFriendsSubTab('requests')}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    friendsSubTab === 'requests'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Requests {pendingRequests.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              </div>

              {/* SUB TAB: REQUESTS */}
              {friendsSubTab === 'requests' && (
                <div className="space-y-2">
                  {pendingRequests.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5 text-center text-slate-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold">No pending friend requests.</p>
                    </div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div
                        key={req.uid}
                        className="p-3 rounded-2xl bg-black/30 border border-amber-500/30 flex items-center justify-between gap-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <img src={req.photoURL} alt={req.displayName} className="w-9 h-9 rounded-full border border-white/20 object-cover" />
                          <div className="truncate">
                            <span className="text-xs font-bold text-white block truncate">{req.displayName}</span>
                            <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider">Wants to be friends</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => acceptFriendRequest(req.uid)}
                            className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black transition-all cursor-pointer shadow-sm"
                            aria-label="Accept Request"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => declineFriendRequest(req.uid)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all cursor-pointer"
                            aria-label="Decline Request"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SUB TAB: ALL FRIENDS */}
              {friendsSubTab === 'all' && (
                <div className="space-y-2">
                  {friendsList.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-black/20 border border-white/5 text-center text-slate-500">
                      <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-semibold">No friends added yet.</p>
                      <p className="text-[10px] mt-1 opacity-70">Search Google Account Name above to add friends!</p>
                    </div>
                  ) : (
                    friendsList.map((friend) => {
                      const effStatus = getEffectiveStatus(friend);
                      const isOnline = effStatus === 'online';
                      const isInGame = effStatus === 'in-game';

                      return (
                        <motion.button
                          key={friend.uid}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedFriend(friend);
                            onClose();
                          }}
                          className="w-full p-3 rounded-2xl bg-black/25 hover:bg-white/5 border border-white/10 flex items-center justify-between gap-3 transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="relative">
                              <img
                                src={friend.photoURL}
                                alt={friend.displayName}
                                className="w-10 h-10 rounded-full border border-white/20 object-cover"
                              />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-slate-900 ${
                                  isInGame
                                    ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                                    : isOnline
                                    ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]'
                                    : 'bg-slate-500'
                                }`}
                              />
                            </div>

                            <div className="truncate">
                              <span className="block text-xs font-bold text-white truncate">
                                {friend.displayName}
                              </span>
                              
                              {isInGame ? (
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                  <Swords className="w-3 h-3" /> In Game
                                </span>
                              ) : isOnline ? (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                  ● Online
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  Offline ({formatRelativeTime(friend.lastSeen)})
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                            Action
                          </span>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SidebarDrawer;

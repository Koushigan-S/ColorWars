import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { UserProfile, MatchHistory } from '../types';
import { formatDate, formatDuration } from '../utils';
import { motion } from 'framer-motion';
import { Calendar, Eye, ArrowLeft, Gamepad2, Award, Percent, Hourglass } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

export const Profile: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchProfileAndHistory = async () => {
      setLoading(true);
      try {
        // 1. Fetch User Profile
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setProfileData(null);
          setLoading(false);
          return;
        }

        const data = userDocSnap.data() as UserProfile;
        setProfileData(data);

        // 2. Fetch Match History
        // To avoid composite index requirements, we run two separate queries
        // and merge/sort them in memory.
        const matchesCol = collection(db, 'matches');
        
        const hostQuery = query(matchesCol, where('players.red.uid', '==', uid));
        const guestQuery = query(matchesCol, where('players.blue.uid', '==', uid));

        const [hostSnap, guestSnap] = await Promise.all([
          getDocs(hostQuery),
          getDocs(guestQuery)
        ]);

        const mergedMatches: MatchHistory[] = [];
        const seenIds = new Set<string>();

        const addMatch = (docSnap: any) => {
          docSnap.forEach((doc: any) => {
            const match = doc.data() as MatchHistory;
            if (!seenIds.has(match.id)) {
              seenIds.add(match.id);
              mergedMatches.push(match);
            }
          });
        };

        addMatch(hostSnap);
        addMatch(guestSnap);

        // Sort by date descending
        mergedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMatches(mergedMatches);

      } catch (e) {
        console.error('Error loading profile page:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndHistory();
  }, [uid]);

  if (loading) return <LoadingScreen />;

  if (!profileData) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 bg-[#02040a] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
        <p className="text-gray-400 mb-6 text-sm">The user profile you are looking for does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-white text-black py-2.5 px-5 rounded-xl font-semibold transition-all cursor-pointer hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </button>
      </div>
    );
  }

  // Display status style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.1)]">Online</span>;
      case 'in-game':
        return <span className="bg-game-red/15 text-game-red border border-game-red/30 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse">In Game</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-white/5 text-[10px] font-semibold px-2 py-0.5 rounded-full">Offline</span>;
    }
  };

  const stats = profileData.stats || {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winPercentage: 0,
    rating: 1200,
    createdRoomsCount: 0,
    joinedRoomsCount: 0,
    lastMatchDate: null,
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Header Navigation */}
      <div className="mb-6 flex justify-start">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to HQ</span>
        </button>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Chess.com style Profile Details */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden text-center">
            {/* Header background accents */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-game-red to-game-blue opacity-50"></div>

            <img
              src={profileData.photoURL}
              alt={profileData.displayName}
              className="w-24 h-24 rounded-full border-4 border-slate-900 shadow-xl mx-auto mb-4 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.05)]"
            />

            <h2 className="font-display text-2xl font-black text-white leading-tight truncate">{profileData.displayName}</h2>
            {profileData.playerId && (
              <div className="mt-1 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg shadow-sm">
                  ID: #{profileData.playerId}
                </span>
              </div>
            )}
            <div className="flex justify-center mt-2.5 mb-6">{getStatusBadge(profileData.status)}</div>

            {/* General timestamps */}
            <div className="space-y-2 border-t border-white/5 pt-4 text-xs text-gray-400 text-left">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Joined {formatDate(profileData.dateJoined)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span>Last seen {formatDate(profileData.lastSeen)}</span>
              </div>
            </div>
          </div>

          {/* Core Stats Overview */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl">
            <h3 className="font-display text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
              Combat Statistics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Rating Card */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center">
                <Award className="w-5 h-5 text-yellow-500 mb-1" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Rating Score</span>
                <span className="text-xl font-black text-white mt-0.5">{stats.rating}</span>
              </div>

              {/* Win Percentage Card */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center">
                <Percent className="w-5 h-5 text-emerald-500 mb-1" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Win Rate</span>
                <span className="text-xl font-black text-white mt-0.5">{stats.winPercentage}%</span>
              </div>

              {/* Games Played Card */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 text-center flex flex-col justify-center items-center col-span-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Games</span>
                <span className="text-xl font-black text-white mt-0.5">{stats.gamesPlayed}</span>
              </div>
            </div>

            {/* Wins, Losses bar */}
            <div className="mt-6">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-green-500">Wins: {stats.wins}</span>
                <span className="text-game-red">Losses: {stats.losses}</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full flex overflow-hidden border border-white/5">
                {stats.gamesPlayed > 0 ? (
                  <>
                    <div
                      style={{ width: `${(stats.wins / stats.gamesPlayed) * 100}%` }}
                      className="h-full bg-green-500"
                    ></div>
                    <div
                      style={{ width: `${(stats.losses / stats.gamesPlayed) * 100}%` }}
                      className="h-full bg-game-red"
                    ></div>
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-800"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Scrollable Match History */}
        <div className="lg:col-span-2 flex flex-col glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl min-h-[60svh] relative">
          <h3 className="font-display text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">
            Match History
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[600px]">
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Hourglass className="w-8 h-8 text-gray-600 mb-2 animate-pulse" />
                <p className="text-gray-500 text-sm">No matches registered on record.</p>
              </div>
            ) : (
              matches.map((match) => {
                const isRed = match.players.red.uid === uid;
                const myScore = isRed ? match.scores.red : match.scores.blue;
                const oppScore = isRed ? match.scores.blue : match.scores.red;
                const opponent = isRed ? match.players.blue : match.players.red;
                
                const isDraw = match.winnerId === 'draw';
                const isWin = match.winnerId === uid;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-950/40 hover:bg-slate-900/30 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between items-center gap-4"
                  >
                    {/* Left: Date, duration */}
                    <div className="text-left text-xs text-gray-500 space-y-1 w-full sm:w-auto">
                      <span className="font-mono text-gray-400 block font-semibold">Room {match.roomId}</span>
                      <span className="block">{formatDate(match.date)}</span>
                      <span className="block text-[10px] text-gray-600 font-medium">Duration {formatDuration(match.duration)}</span>
                    </div>

                    {/* Center: Match Details */}
                    <div className="flex items-center justify-center gap-4 max-w-sm w-full">
                      {/* You (Host or Guest) */}
                      <div className="flex items-center gap-2 justify-end w-1/3 truncate text-right">
                        <span className="text-xs font-bold text-white truncate">{isRed ? match.players.red.displayName : match.players.blue.displayName}</span>
                        <img
                          src={isRed ? match.players.red.photoURL : match.players.blue.photoURL}
                          alt="avatar"
                          className="w-7 h-7 rounded-full border border-white/10"
                        />
                      </div>

                      {/* Score Board */}
                      <div className="px-3 py-1 bg-slate-950 border border-white/5 rounded-lg font-mono text-sm font-black flex gap-1.5 shadow-inner">
                        <span className={isRed ? 'text-game-red' : 'text-game-blue'}>{myScore}</span>
                        <span className="text-gray-600">:</span>
                        <span className={isRed ? 'text-game-blue' : 'text-game-red'}>{oppScore}</span>
                      </div>

                      {/* Opponent */}
                      <div className="flex items-center gap-2 justify-start w-1/3 truncate text-left">
                        <img
                          src={opponent.photoURL}
                          alt="avatar"
                          className="w-7 h-7 rounded-full border border-white/10"
                        />
                        <span className="text-xs font-semibold text-gray-300 truncate">{opponent.displayName}</span>
                      </div>
                    </div>

                    {/* Right: Outcome Badge */}
                    <div className="w-full sm:w-auto text-right">
                      {isDraw ? (
                        <span className="inline-block text-center w-16 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] uppercase font-bold tracking-wider rounded-lg">
                          Draw
                        </span>
                      ) : isWin ? (
                        <span className="inline-block text-center w-16 py-1 bg-green-500/15 text-green-400 border border-green-500/25 text-[10px] uppercase font-bold tracking-wider rounded-lg shadow-[0_0_8px_rgba(34,197,94,0.08)]">
                          Win
                        </span>
                      ) : (
                        <span className="inline-block text-center w-16 py-1 bg-game-red/10 text-game-red border border-game-red/20 text-[10px] uppercase font-bold tracking-wider rounded-lg shadow-[0_0_8px_rgba(239,68,68,0.08)]">
                          Loss
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { GameEngine } from '../game-engine/engine';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ShieldAlert, Swords, RefreshCcw } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { BoardState, BoardCell, PlayerColor } from '../types';

interface FlyingDot {
  id: string;
  color: PlayerColor;
  startR: number;
  startC: number;
  endR: number;
  endC: number;
}

export const RoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    activeRoom,
    loadingRoom,
    joinRoom,
    leaveRoom,
    makeMove,
    opponentDisconnected,
    disconnectTimer,
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Local state for displaying animated chain reaction steps
  const [displayBoard, setDisplayBoard] = useState<BoardState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevBoardRef = useRef<BoardState | null>(null);

  // Flying dots state for explosion transitions
  const [flyingDots, setFlyingDots] = useState<FlyingDot[]>([]);
  // Game over results modal display delay state
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (activeRoom?.gameStatus === 'ended') {
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [activeRoom?.gameStatus]);

  // Sync Room on Direct Navigation / Refresh
  useEffect(() => {
    if (!profile || !code) return;

    const checkAndInit = async () => {
      const roomCode = code.toUpperCase();
      const roomRef = doc(db, 'rooms', roomCode);
      
      try {
        const roomSnap = await getDoc(roomRef);
        
        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          
          if (roomData.gameStatus === 'waiting' && roomData.hostId !== profile.uid && roomData.guestId !== profile.uid) {
            // Unoccupied waiting room: auto-join as guest
            await joinRoom(roomCode);
          } else if (roomData.hostId === profile.uid || roomData.guestId === profile.uid) {
            // Already a member: trigger listener in GameContext by setting presence
            const updatePayload: any = {};
            updatePayload[`playersConnected.${profile.uid}`] = true;
            updatePayload[`lastDisconnectTime.${profile.uid}`] = null;
            await updateDoc(roomRef, updatePayload);
          } else {
            // Game is active or ended, and user is not a player
            navigate('/');
          }
        } else {
          // Room code doesn't exist
          navigate('/');
        }
      } catch (e) {
        console.error('Failed to resolve room:', e);
        navigate('/');
      } finally {
        setInitializing(false);
      }
    };

    if (!activeRoom || activeRoom.id !== code.toUpperCase()) {
      checkAndInit();
    } else {
      setInitializing(false);
    }
  }, [code, profile, activeRoom]);

  // Chain Reaction local animation sync
  useEffect(() => {
    if (!activeRoom) return;

    // Handle initial board load
    if (!displayBoard) {
      setDisplayBoard(activeRoom.boardState);
      prevBoardRef.current = activeRoom.boardState;
      return;
    }

    // Check if the board state has actually changed on the server
    const hasChanged = JSON.stringify(activeRoom.boardState) !== JSON.stringify(prevBoardRef.current);
    
    if (hasChanged) {
      const prevBoard = prevBoardRef.current || [];
      const lastMove = activeRoom.lastMove;

      if (lastMove && prevBoard.length > 0) {
        const { row, col, playerColor } = lastMove;

        setIsAnimating(true);
        try {
          // Re-simulate move locally on the old state to get the explosion timeline
          const { steps } = GameEngine.executeMove(prevBoard, row, col, playerColor);
          
          let stepIdx = 0;
          const playNextStep = () => {
            if (stepIdx < steps.length) {
              const currentStepBoard = steps[stepIdx];
              const prevStepBoard = stepIdx === 0 ? prevBoard : steps[stepIdx - 1];

              // Detect explosions and spawn flying dots
              const newFlyingDots: FlyingDot[] = [];
              for (let i = 0; i < prevStepBoard.length; i++) {
                if (prevStepBoard[i].count >= 4 && currentStepBoard[i].count < prevStepBoard[i].count) {
                  const r = Math.floor(i / GameEngine.COLS);
                  const c = i % GameEngine.COLS;
                  
                  const neighbors = [
                    { r: r - 1, c },
                    { r: r + 1, c },
                    { r, c: c - 1 },
                    { r, c: c + 1 },
                  ];
                  
                  neighbors.forEach((n) => {
                    newFlyingDots.push({
                      id: `${i}-${n.r}-${n.c}-${stepIdx}-${Math.random()}`,
                      color: prevStepBoard[i].color || playerColor,
                      startR: r,
                      startC: c,
                      endR: n.r,
                      endC: n.c,
                    });
                  });
                }
              }

              if (newFlyingDots.length > 0) {
                setFlyingDots(newFlyingDots);
                setTimeout(() => {
                  setFlyingDots([]);
                }, 240);
              }

              setDisplayBoard(currentStepBoard);
              stepIdx++;
              setTimeout(playNextStep, 250); // 250ms per explosion wave
            } else {
              setIsAnimating(false);
              setDisplayBoard(activeRoom.boardState);
            }
          };
          playNextStep();
        } catch (e) {
          console.error('Explosion playback failed:', e);
          setIsAnimating(false);
          setDisplayBoard(activeRoom.boardState);
        }
      } else {
        setDisplayBoard(activeRoom.boardState);
      }

      prevBoardRef.current = activeRoom.boardState;
    }
  }, [activeRoom?.boardState, displayBoard]);

  if (loadingRoom || initializing || !activeRoom || !profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#e09e80] p-4 text-center min-h-svh">
        <div className="w-12 h-12 border-4 border-[#ef5252] border-t-[#3b82f6] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs text-[#5c3e32] tracking-widest uppercase font-bold animate-pulse">Loading Room details...</p>
      </div>
    );
  }

  // Derived properties
  const myProfile = profile;
  const myUid = myProfile.uid;
  const hostColor = activeRoom.hostColor || 'red';
  const myColor = activeRoom.hostId === myUid ? hostColor : activeRoom.guestId === myUid ? (hostColor === 'red' ? 'blue' : 'red') : null;
  const opponentColor = myColor === 'red' ? 'blue' : myColor === 'blue' ? 'red' : null;
  const isMyTurn = activeRoom.currentTurn === myUid && activeRoom.gameStatus === 'playing';
  const turnColor = activeRoom.currentTurn === activeRoom.hostId ? hostColor : (hostColor === 'red' ? 'blue' : 'red');
  const opponentUid = activeRoom.hostId === myUid ? activeRoom.guestId : activeRoom.hostId;
  const opponentName = activeRoom.hostId === myUid ? activeRoom.guestName || 'Waiting...' : activeRoom.hostName;
  const opponentPhoto = activeRoom.hostId === myUid ? activeRoom.guestPhoto : activeRoom.hostPhoto;
  
  const boardToRender = displayBoard || activeRoom.boardState;
  const { red: redCount, blue: blueCount } = GameEngine.calculateScores(boardToRender);

  // Connection states
  const opponentConnected = opponentUid ? (activeRoom.playersConnected[opponentUid] ?? false) : false;

  // Convert 1D boardState to 2D array for rendering grid mapping
  const board2D: BoardCell[][] = [];
  for (let r = 0; r < GameEngine.ROWS; r++) {
    board2D.push(
      boardToRender.slice(
        r * GameEngine.COLS,
        r * GameEngine.COLS + GameEngine.COLS
      )
    );
  }

  const handleCellClick = async (r: number, c: number) => {
    if (!isMyTurn || isAnimating || !myColor) return;

    if (!GameEngine.isValidMove(boardToRender, r, c, myColor)) return;

    try {
      await makeMove(r, c);
    } catch (err) {
      console.error('Failed to make move:', err);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(activeRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for displaying countdown time format (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Piece dots layout sub-renderer (dice face configurations)
  const renderDots = (count: number) => {
    if (count === 1) {
      return <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>;
    }
    if (count === 2) {
      return (
        <div className="flex gap-1.5 rotate-45">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
        </div>
      );
    }
    if (count === 3) {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
          </div>
        </div>
      );
    }
    if (count >= 4) {
      return (
        <div className="grid grid-cols-2 gap-1 p-0.5">
          <div className="w-2 h-2 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div className="w-2 h-2 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div className="w-2 h-2 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
          <div className="w-2 h-2 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`relative flex flex-col min-h-svh w-full items-center justify-center transition-colors duration-500 ${
        activeRoom.gameStatus === 'playing' && turnColor === 'blue'
          ? 'bg-[#809ee0]'
          : 'bg-[#e09e80]'
      } p-4 font-sans select-none overflow-hidden`}
    >
      
      {/* 2 PLAYER GAMES STYLED FIXED HUD TABS (Desktop Only) */}
      {(activeRoom.gameStatus === 'playing' || activeRoom.gameStatus === 'ended') && (
        <>
          {/* Left Score Tab */}
          <div className="hidden sm:flex fixed left-0 top-1/2 -translate-y-1/2 w-16 h-36 bg-[#fcf4e8] rounded-r-[36px] shadow-lg border-y border-r border-[#cfc0ae]/30 flex-col items-center justify-center z-30 select-none">
            <div className="text-center font-display font-black text-2xl flex flex-col items-center justify-center gap-1 leading-none">
              <span className="text-[#ef5252]">{redCount}</span>
              <span className="text-[#a49684] text-lg select-none">•</span>
              <span className="text-[#3b82f6]">{blueCount}</span>
            </div>
          </div>

          {/* Right Exit Tab */}
          <button
            onClick={leaveRoom}
            className="hidden sm:flex fixed right-0 top-1/2 -translate-y-1/2 w-16 h-36 bg-[#fcf4e8] hover:bg-[#fffcf8] rounded-l-[36px] shadow-lg border-y border-l border-[#cfc0ae]/30 flex-col items-center justify-center z-30 transition-all hover:-translate-x-1.5 cursor-pointer active:scale-95 group border-none"
          >
            <span className="font-display font-black text-sm text-[#5c3e32] group-hover:text-red-500 tracking-widest [writing-mode:vertical-lr] select-none uppercase">
              EXIT
            </span>
          </button>
        </>
      )}

      {/* MOBILE HUD HEADER (Mobile Only) */}
      {(activeRoom.gameStatus === 'playing' || activeRoom.gameStatus === 'ended') && (
        <div className="w-full max-w-sm flex justify-between items-center mb-4 sm:hidden bg-[#fcf4e8] p-3 rounded-2xl border border-[#cfc0ae]/20 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#8e7b6d] uppercase tracking-wider">Score:</span>
            <span className="font-display font-black text-lg text-[#ef5252]">{redCount}</span>
            <span className="text-slate-400 font-bold">•</span>
            <span className="font-display font-black text-lg text-[#3b82f6]">{blueCount}</span>
          </div>
          
          <button
            onClick={leaveRoom}
            className="bg-[#ef5252] hover:bg-red-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm border-none cursor-pointer active:scale-95 transition-all"
          >
            EXIT
          </button>
        </div>
      )}

      {/* RENDER WAITING LOBBY */}
      {activeRoom.gameStatus === 'waiting' && (
        <div className="w-full max-w-sm flex flex-col items-center justify-center p-6 bg-[#fcf4e8] rounded-3xl relative border border-[#cfc0ae]/30 shadow-xl min-h-[50svh] text-[#5c3e32]">
          <div className="text-center w-full relative">
            <div className="relative inline-flex p-4 bg-[#f8ede0] rounded-full border border-[#cfc0ae]/30 mb-6 shadow-inner">
              <RefreshCcw className="w-10 h-10 text-[#ef5252] animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            <h2 className="font-display text-2xl font-black mb-1 uppercase tracking-tight text-[#422c23]">Lobby</h2>
            <p className="text-xs text-[#8e7b6d] font-bold mb-8 uppercase tracking-wider">Waiting for Opponent...</p>

            {/* Room code display */}
            <div className="flex flex-col gap-2 p-5 bg-[#f8ede0] border border-[#cfc0ae]/20 rounded-2xl mb-8 relative shadow-inner">
              <span className="text-[9px] text-[#8e7b6d] uppercase font-black tracking-widest">Share Room Code</span>
              <span className="font-mono text-3xl font-extrabold text-[#422c23] tracking-widest select-all">{activeRoom.id}</span>
              
              <button
                onClick={copyCode}
                className="w-full flex items-center justify-center gap-2 mt-4 bg-[#fcf4e8] hover:bg-[#fffcf8] text-[#5c3e32] font-black py-2.5 px-4 rounded-xl border border-[#cfc0ae]/30 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-[#8e7b6d]" />}
                <span className="text-xs">{copied ? 'CODE COPIED!' : 'COPY CODE'}</span>
              </button>
            </div>

            {/* Player details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8ede0] p-4 rounded-2xl text-center border border-[#cfc0ae]/20 shadow-sm">
                <img
                  src={activeRoom.hostPhoto}
                  alt={activeRoom.hostName}
                  className={`w-12 h-12 rounded-full border-2 ${
                    hostColor === 'red' ? 'border-[#ef5252]' : 'border-[#3b82f6]'
                  } shadow-sm mx-auto mb-2`}
                />
                <span className="block text-xs font-black text-[#422c23] truncate">{activeRoom.hostName}</span>
                <span className={`text-[9px] uppercase font-bold tracking-wider ${
                  hostColor === 'red' ? 'text-[#ef5252]' : 'text-[#3b82f6]'
                } mt-0.5 block`}>
                  {hostColor === 'red' ? 'Red' : 'Blue'} (Host)
                </span>
              </div>

              <div className="bg-[#f8ede0] p-4 rounded-2xl text-center border border-[#cfc0ae]/20 shadow-sm flex flex-col justify-center items-center opacity-60">
                <div className={`w-12 h-12 rounded-full border-2 border-dashed ${
                  hostColor === 'red' ? 'border-[#3b82f6]' : 'border-[#ef5252]'
                } flex items-center justify-center mb-2 bg-[#fcf4e8]`}>
                  <span className="text-[#8e7b6d] font-bold text-lg">?</span>
                </div>
                <span className="block text-xs font-bold text-[#8e7b6d] truncate">Waiting...</span>
                <span className={`text-[9px] uppercase font-bold tracking-wider ${
                  hostColor === 'red' ? 'text-[#3b82f6]' : 'text-[#ef5252]'
                } mt-0.5 block`}>
                  {hostColor === 'red' ? 'Blue' : 'Red'} (Guest)
                </span>
              </div>
            </div>

            <button
              onClick={leaveRoom}
              className="mt-8 bg-transparent text-[#ef5252] hover:bg-[#ef5252]/5 border border-[#ef5252]/20 font-black text-xs py-2.5 px-6 rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              LEAVE ROOM
            </button>
          </div>
        </div>
      )}

      {/* RENDER ACTIVE GAMEPLAY */}
      {(activeRoom.gameStatus === 'playing' || activeRoom.gameStatus === 'ended') && (
        <div className="w-full max-w-sm flex flex-col gap-4 items-center">
          
          {/* OPPONENT CARD (Top) */}
          <div
            className={`w-full flex items-center justify-between p-3 bg-[#fcf4e8] rounded-2xl border transition-all shadow-sm ${
              activeRoom.currentTurn === opponentUid
                ? opponentColor === 'red'
                  ? 'border-[#ef5252] ring-4 ring-[#ef5252]/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  : 'border-[#3b82f6] ring-4 ring-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'border-[#cfc0ae]/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={opponentPhoto || 'https://api.dicebear.com/7.x/identicon/svg'}
                  alt={opponentName}
                  className={`w-10 h-10 rounded-full border-2 ${
                    opponentColor === 'red' ? 'border-[#ef5252]' : 'border-[#3b82f6]'
                  }`}
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-[#fcf4e8] ${
                    opponentConnected ? 'bg-green-500 shadow-sm' : 'bg-amber-500 animate-pulse'
                  }`}
                ></span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-[#422c23] truncate max-w-[150px]">{opponentName}</span>
                <span className={`text-[9px] uppercase font-black tracking-wider ${
                  opponentColor === 'red' ? 'text-[#ef5252]' : 'text-[#3b82f6]'
                }`}>
                  {opponentColor === 'red' ? 'RED PLAYER' : 'BLUE PLAYER'}
                </span>
              </div>
            </div>
            
            {activeRoom.currentTurn === opponentUid && (
              <span className="text-[9px] font-black uppercase text-[#8e7b6d] animate-pulse pr-2 tracking-wider">
                Thinking...
              </span>
            )}
          </div>

          {/* Connection offline alert banner */}
          <AnimatePresence>
            {opponentDisconnected && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="w-full"
              >
                <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-800 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      Opponent offline (timer: {formatTimer(disconnectTimer)})
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THE 5x5 BOARD GRID */}
          <div className="w-full aspect-square bg-[#d6c5b2] p-2 rounded-3xl shadow-xl relative border border-[#c1af9c]">
            <div className="grid grid-cols-5 gap-2.5 w-full aspect-square relative">
              {board2D.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  // Check click validity for hovering cursor classes
                  const isCellClickable =
                    isMyTurn &&
                    !isAnimating &&
                    myColor &&
                    GameEngine.isValidMove(boardToRender, rIdx, cIdx, myColor);

                  return (
                    <button
                      key={`${rIdx}-${cIdx}`}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      disabled={!isCellClickable}
                      className={`aspect-square w-full rounded-2xl relative overflow-hidden flex items-center justify-center transition-all ${
                        cell.color === 'red'
                          ? 'bg-[#ffdad5]'
                          : cell.color === 'blue'
                          ? 'bg-[#d4e5ff]'
                          : 'bg-[#fcf4e8]'
                      } border border-[#e8dac7] ${
                        isCellClickable
                          ? 'cursor-pointer active:scale-95 shadow-sm hover:scale-[1.02]'
                          : 'cursor-not-allowed'
                      }`}
                    >
                      {/* Piece orbs */}
                      <AnimatePresence>
                        {cell.count > 0 && cell.color && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md relative ${
                              cell.color === 'red'
                                ? 'bg-gradient-to-br from-[#ef5252] to-[#c73434]'
                                : 'bg-gradient-to-br from-[#3b82f6] to-[#1c55bc]'
                            }`}
                          >
                            {/* Inner soft ring for premium depth */}
                            <div className="absolute inset-0.5 rounded-full border border-white/20"></div>
                            
                            {/* Dots inside */}
                            {renderDots(cell.count)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })
              )}

              {/* Flying dots for explosion transitions */}
              {flyingDots.map((dot) => (
                <motion.div
                  key={dot.id}
                  initial={{
                    left: `${dot.startC * 20 + 10}%`,
                    top: `${dot.startR * 20 + 10}%`,
                    x: '-50%',
                    y: '-50%',
                    scale: 0.6,
                    opacity: 1
                  }}
                  animate={{
                    left: `${dot.endC * 20 + 10}%`,
                    top: `${dot.endR * 20 + 10}%`,
                    scale: 0.9,
                    opacity: [1, 1, 0]
                  }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`absolute w-6 h-6 rounded-full z-20 shadow-md ${
                    dot.color === 'red'
                      ? 'bg-gradient-to-br from-[#ef5252] to-[#c73434]'
                      : 'bg-gradient-to-br from-[#3b82f6] to-[#1c55bc]'
                  } border border-white/40`}
                />
              ))}
            </div>
          </div>

          {/* SELF PLAYER CARD (Bottom) */}
          <div
            className={`w-full flex items-center justify-between p-3 bg-[#fcf4e8] rounded-2xl border transition-all shadow-sm ${
              activeRoom.currentTurn === myUid
                ? myColor === 'red'
                  ? 'border-[#ef5252] ring-4 ring-[#ef5252]/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  : 'border-[#3b82f6] ring-4 ring-[#3b82f6]/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'border-[#cfc0ae]/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={myProfile.photoURL}
                alt={myProfile.displayName}
                className={`w-10 h-10 rounded-full border-2 ${
                  myColor === 'red' ? 'border-[#ef5252]' : 'border-[#3b82f6]'
                }`}
              />
              <div className="text-left">
                <span className="block text-xs font-black text-[#422c23] truncate max-w-[150px]">{myProfile.displayName} (You)</span>
                <span className={`text-[9px] uppercase font-black tracking-wider ${
                  myColor === 'red' ? 'text-[#ef5252]' : 'text-[#3b82f6]'
                }`}>
                  {myColor === 'red' ? 'RED PLAYER' : 'BLUE PLAYER'}
                </span>
              </div>
            </div>
            
            {activeRoom.currentTurn === myUid && (
              <span className="text-[9px] font-black uppercase text-green-600 animate-pulse pr-2 tracking-widest font-display">
                Your Turn
              </span>
            )}
          </div>

        </div>
      )}

      {/* GAME OVER DIALOG MODAL */}
      <AnimatePresence>
        {showResults && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#422c23]/60 backdrop-blur-md"
            ></motion.div>

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm p-6 bg-[#fcf4e8] rounded-3xl border border-[#cfc0ae]/30 shadow-2xl relative text-center overflow-hidden"
            >
              {/* Dynamic Winner Glow Accent */}
              <div
                className={`absolute top-0 inset-x-0 h-1.5 ${
                  activeRoom.winnerId === 'draw'
                    ? 'bg-slate-400'
                    : (activeRoom.winnerId === activeRoom.hostId ? hostColor : (hostColor === 'red' ? 'blue' : 'red')) === 'red'
                    ? 'bg-[#ef5252]'
                    : 'bg-[#3b82f6]'
                }`}
              ></div>

              <div className="relative py-2 text-[#5c3e32]">
                <Swords className="w-12 h-12 mx-auto text-[#8e7b6d] mb-4 animate-bounce" />

                <span className="text-[9px] text-[#8e7b6d] uppercase tracking-widest font-black block">Battle Result</span>
                
                {/* Result Message */}
                <h2 className="font-display text-2xl font-black mt-1 uppercase tracking-tight text-[#422c23]">
                  {activeRoom.winnerId === 'draw' ? (
                    'The Match is a Draw'
                  ) : activeRoom.winnerId === myUid ? (
                    <span className="text-green-600">Victory is Yours!</span>
                  ) : (
                    <span className="text-[#ef5252]">Defeat!</span>
                  )}
                </h2>

                {/* Score Summary */}
                <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-[#f8ede0] border border-[#cfc0ae]/20 rounded-2xl max-w-xs mx-auto shadow-inner">
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-black tracking-wider text-[#ef5252]">Red Count</span>
                    <span className="block text-2xl font-black text-[#422c23]">{redCount}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-black tracking-wider text-[#3b82f6]">Blue Count</span>
                    <span className="block text-2xl font-black text-[#422c23]">{blueCount}</span>
                  </div>
                </div>

                {/* Rating updates display */}
                <div className="text-xs text-[#8e7b6d] font-bold uppercase tracking-wider mb-6">
                  {activeRoom.winnerId === 'draw' ? (
                    <span>Rating change: +2 Score</span>
                  ) : activeRoom.winnerId === myUid ? (
                    <span className="text-green-600">+15 Rating Score</span>
                  ) : (
                    <span className="text-[#ef5252]">-10 Rating Score</span>
                  )}
                </div>

                <button
                  onClick={leaveRoom}
                  className="w-full bg-[#ef5252] text-white hover:bg-[#c73434] py-3.5 px-6 rounded-2xl font-black uppercase text-xs tracking-wider shadow-md transition-all cursor-pointer active:scale-95 border-none"
                >
                  Return to Main Menu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomPage;

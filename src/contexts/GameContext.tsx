import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import type { Room, PlayerColor, MatchHistory } from '../types';
import { GameEngine } from '../game-engine/engine';
import { generateRoomCode } from '../utils';
import confetti from 'canvas-confetti';

interface GameContextType {
  activeRoom: Room | null;
  loadingRoom: boolean;
  error: string | null;
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  makeMove: (row: number, col: number) => Promise<void>;
  claimDisconnectVictory: () => Promise<void>;
  opponentDisconnected: boolean;
  disconnectTimer: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfileStatus } = useAuth();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [disconnectTimer, setDisconnectTimer] = useState(300); // 5 minutes in seconds

  const timerRef = useRef<any>(null);
  const navigate = useNavigate();
  
  // Track if we already processed stats for the current room
  const processedRoomId = useRef<string | null>(null);

  // Helper to determine active user's player color
  const getPlayerColor = (): PlayerColor | null => {
    if (!activeRoom || !profile) return null;
    const hostColor = activeRoom.hostColor || 'red';
    if (activeRoom.hostId === profile.uid) return hostColor;
    if (activeRoom.guestId === profile.uid) return hostColor === 'red' ? 'blue' : 'red';
    return null;
  };

  // Real-time Firestore Room snapshot listener
  useEffect(() => {
    if (!profile || !activeRoom?.id) {
      // Clear room if we are not in a room context
      return;
    }

    const roomRef = doc(db, 'rooms', activeRoom.id);
    const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setActiveRoom(null);
        setError('Room no longer exists.');
        navigate('/');
        return;
      }

      const roomData = snapshot.data() as Room;
      setActiveRoom(roomData);

      // Handle connection presence and disconnect timeouts
      const myUid = profile.uid;
      const opponentUid = roomData.hostId === myUid ? roomData.guestId : roomData.hostId;

      if (roomData.gameStatus === 'playing' && opponentUid) {
        const isOpponentConnected = roomData.playersConnected[opponentUid] ?? false;
        
        if (!isOpponentConnected) {
          setOpponentDisconnected(true);
          const disconnectTimeStr = roomData.lastDisconnectTime[opponentUid];
          
          if (disconnectTimeStr) {
            const disconnectTime = new Date(disconnectTimeStr).getTime();
            const elapsed = Math.floor((Date.now() - disconnectTime) / 1000);
            const remaining = Math.max(0, 300 - elapsed);
            setDisconnectTimer(remaining);
          }
        } else {
          setOpponentDisconnected(false);
          setDisconnectTimer(300);
        }
      } else {
        setOpponentDisconnected(false);
        setDisconnectTimer(300);
      }

      // Handle Game End Trigger (Confetti & Statistics updating)
      if (roomData.gameStatus === 'ended' && roomData.winnerId && processedRoomId.current !== roomData.id) {
        processedRoomId.current = roomData.id;
        
        // Update user statistics locally
        await updateUserStatistics(roomData);

        // Show confetti if you are the winner!
        const isWinner = roomData.winnerId === myUid;

        if (isWinner) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          });
        }
      }
    });

    return () => unsubscribe();
  }, [profile, activeRoom?.id]);

  // Set up connection presence heartbeats and unload listeners
  useEffect(() => {
    if (!profile || !activeRoom?.id) return;

    const myUid = profile.uid;
    const roomRef = doc(db, 'rooms', activeRoom.id);

    // Set connection status on load
    const setConnected = async () => {
      const updatePayload: any = {};
      updatePayload[`playersConnected.${myUid}`] = true;
      updatePayload[`lastDisconnectTime.${myUid}`] = null;
      await updateDoc(roomRef, updatePayload);
    };

    setConnected();

    // Browser close / navigation presence toggle handler
    const setDisconnected = () => {
      const updatePayload: any = {};
      updatePayload[`playersConnected.${myUid}`] = false;
      updatePayload[`lastDisconnectTime.${myUid}`] = new Date().toISOString();
      
      // Use standard updateDoc (since sendBeacon / keepalive isn't directly needed for standard tabs)
      updateDoc(roomRef, updatePayload).catch(e => console.error(e));
    };

    const handleBeforeUnload = () => {
      setDisconnected();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setDisconnected();
    };
  }, [profile, activeRoom?.id]);

  // Countdown timer for opponent disconnection
  useEffect(() => {
    if (opponentDisconnected && disconnectTimer > 0 && activeRoom?.gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setDisconnectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Claim victory if countdown is over and opponent is still offline
            claimDisconnectVictory();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [opponentDisconnected, disconnectTimer, activeRoom?.gameStatus]);

  // Create Room Action
  const createRoom = async (): Promise<string> => {
    if (!profile) throw new Error('You must be signed in to create a room');
    setLoadingRoom(true);
    setError(null);

    const roomCode = generateRoomCode();
    const boardState = GameEngine.initializeBoard();
    const roomRef = doc(db, 'rooms', roomCode);

    // Randomize host color assignment
    const hostColor: PlayerColor = Math.random() < 0.5 ? 'red' : 'blue';

    const newRoom: Room = {
      id: roomCode,
      hostId: profile.uid,
      hostName: profile.displayName,
      hostPhoto: profile.photoURL,
      hostColor,
      guestId: null,
      guestName: null,
      guestPhoto: null,
      boardState,
      // Initially set hostId as current turn, which will be updated if host is not Red when Guest joins.
      currentTurn: profile.uid,
      gameStatus: 'waiting',
      winnerId: null,
      createdTime: new Date().toISOString(),
      playersConnected: { [profile.uid]: true },
      lastDisconnectTime: { [profile.uid]: null },
      lastMoveTime: new Date().toISOString(),
      moveCount: 0,
      lastMove: null,
    };

    try {
      await setDoc(roomRef, newRoom);
      
      // Update User Created Rooms Count
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        'stats.createdRoomsCount': profile.stats.createdRoomsCount + 1,
      });

      setActiveRoom(newRoom);
      updateProfileStatus('in-game');
      setLoadingRoom(false);
      navigate(`/room/${roomCode}`);
      return roomCode;
    } catch (e: any) {
      console.error(e);
      setError('Failed to create room. Please try again.');
      setLoadingRoom(false);
      throw e;
    }
  };

  // Join Room Action
  const joinRoom = async (code: string) => {
    if (!profile) throw new Error('You must be signed in to join a room');
    const roomCode = code.toUpperCase().trim();
    if (roomCode.length !== 6) throw new Error('Invalid code length (must be 6 characters)');
    setLoadingRoom(true);
    setError(null);

    const roomRef = doc(db, 'rooms', roomCode);

    try {
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Room not found. Make sure the code is correct.');
      }

      const roomData = roomSnap.data() as Room;

      if (roomData.gameStatus !== 'waiting' || roomData.guestId !== null) {
        throw new Error('This room is already full or finished.');
      }

      if (roomData.hostId === profile.uid) {
        throw new Error('You cannot join your own created room as a second player.');
      }

      // Red color always makes the first move
      const hostColor = roomData.hostColor || 'red';
      const startingTurnId = hostColor === 'red' ? roomData.hostId : profile.uid;

      // Update room details to add guest
      const updatePayload: Partial<Room> = {
        guestId: profile.uid,
        guestName: profile.displayName,
        guestPhoto: profile.photoURL,
        gameStatus: 'playing',
        currentTurn: startingTurnId,
        lastMoveTime: new Date().toISOString(),
      };
      
      const playersConnected = { ...roomData.playersConnected, [profile.uid]: true };
      const lastDisconnectTime = { ...roomData.lastDisconnectTime, [profile.uid]: null };

      await updateDoc(roomRef, {
        ...updatePayload,
        playersConnected,
        lastDisconnectTime,
      });

      // Update User Joined Rooms Count
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        'stats.joinedRoomsCount': profile.stats.joinedRoomsCount + 1,
      });

      setActiveRoom({
        ...roomData,
        ...updatePayload,
        playersConnected,
        lastDisconnectTime,
      });

      updateProfileStatus('in-game');
      setLoadingRoom(false);
      navigate(`/room/${roomCode}`);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to join room.');
      setLoadingRoom(false);
      throw e;
    }
  };

  // Leave Room Action (Forfeits if active)
  const leaveRoom = async () => {
    if (!activeRoom || !profile) return;
    const roomRef = doc(db, 'rooms', activeRoom.id);
    const myUid = profile.uid;

    try {
      if (activeRoom.gameStatus === 'playing') {
        // Player forfeits! Opponent wins
        const opponentUid = activeRoom.hostId === myUid ? activeRoom.guestId : activeRoom.hostId;
        
        const updatePayload: Partial<Room> = {
          gameStatus: 'ended',
          winnerId: opponentUid || 'draw', // If opponent is missing for some reason, draw
        };

        await updateDoc(roomRef, updatePayload);
        
        // Log match in history
        if (opponentUid) {
          await writeMatchHistory({
            ...activeRoom,
            ...updatePayload
          }, opponentUid, myUid);
        }
      } else if (activeRoom.gameStatus === 'waiting' && activeRoom.hostId === myUid) {
        // Host leaves waiting room -> cancel it
        await updateDoc(roomRef, { gameStatus: 'abandoned' });
      }

      // Restore profile status to online
      await updateProfileStatus('online');
      setActiveRoom(null);
      navigate('/');
    } catch (e) {
      console.error('Error leaving room:', e);
    }
  };

  // Make Move Action
  const makeMove = async (row: number, col: number) => {
    if (!activeRoom || !profile) return;
    if (activeRoom.gameStatus !== 'playing') return;
    if (activeRoom.currentTurn !== profile.uid) return;

    const myColor = getPlayerColor();
    if (!myColor) return;

    try {
      const { board: nextBoard } = GameEngine.executeMove(
        activeRoom.boardState,
        row,
        col,
        myColor
      );

      const roomRef = doc(db, 'rooms', activeRoom.id);
      const opponentUid = activeRoom.hostId === profile.uid ? activeRoom.guestId : activeRoom.hostId;
      const nextMoveCount = (activeRoom.moveCount || 0) + 1;

      // Determine if game is over
      const { isOver, winner } = GameEngine.checkGameOver(nextBoard, nextMoveCount);

      const updatePayload: any = {
        boardState: nextBoard,
        lastMoveTime: new Date().toISOString(),
        moveCount: nextMoveCount,
        lastMove: { row, col, playerColor: myColor },
      };

      if (isOver) {
        updatePayload.gameStatus = 'ended';
        let winnerId: string | 'draw' = 'draw';
        let loserId: string | 'draw' = 'draw';
        const hostColor = activeRoom.hostColor || 'red';
        if (winner === 'draw' || !winner) {
          winnerId = 'draw';
          loserId = 'draw';
        } else if (winner === hostColor) {
          winnerId = activeRoom.hostId;
          loserId = activeRoom.guestId || 'draw';
        } else {
          winnerId = activeRoom.guestId || 'draw';
          loserId = activeRoom.hostId;
        }

        updatePayload.winnerId = winnerId;
        await updateDoc(roomRef, updatePayload);

        // Write Match History Document (using roomId as document ID to ensure idempotency)
        await writeMatchHistory({
          ...activeRoom,
          boardState: nextBoard,
          gameStatus: 'ended',
          winnerId,
          moveCount: nextMoveCount,
        }, winnerId, loserId);

      } else {
        // Toggle turn
        updatePayload.currentTurn = opponentUid;
        await updateDoc(roomRef, updatePayload);
      }
    } catch (e) {
      console.error('Failed to make move:', e);
      throw e;
    }
  };

  // Claim victory due to opponent disconnect timeout (5 minutes)
  const claimDisconnectVictory = async () => {
    if (!activeRoom || !profile) return;
    if (activeRoom.gameStatus !== 'playing') return;

    const myUid = profile.uid;
    const opponentUid = activeRoom.hostId === myUid ? activeRoom.guestId : activeRoom.hostId;

    if (!opponentUid) return;

    const roomRef = doc(db, 'rooms', activeRoom.id);

    try {
      const updatePayload: Partial<Room> = {
        gameStatus: 'ended',
        winnerId: myUid,
      };

      await updateDoc(roomRef, updatePayload);

      // Write Match History
      await writeMatchHistory({
        ...activeRoom,
        ...updatePayload,
      }, myUid, opponentUid);

      setOpponentDisconnected(false);
    } catch (e) {
      console.error('Error claiming victory:', e);
    }
  };

  // Write Match History Document helper
  const writeMatchHistory = async (roomData: Room, winnerId: string, loserId: string) => {
    if (!roomData.guestId) return;

    const matchRef = doc(db, 'matches', roomData.id);
    const matchSnap = await getDoc(matchRef);

    // Skip if match history already logged
    if (matchSnap.exists()) return;

    const scores = GameEngine.calculateScores(roomData.boardState);
    const hostColor = roomData.hostColor || 'red';
    const isHostRed = hostColor === 'red';

    const hostPlayer = {
      uid: roomData.hostId,
      displayName: roomData.hostName,
      photoURL: roomData.hostPhoto,
    };

    const guestPlayer = {
      uid: roomData.guestId,
      displayName: roomData.guestName!,
      photoURL: roomData.guestPhoto!,
    };

    const matchHistoryDoc: MatchHistory = {
      id: roomData.id,
      roomId: roomData.id,
      players: {
        red: isHostRed ? hostPlayer : guestPlayer,
        blue: isHostRed ? guestPlayer : hostPlayer,
      },
      winnerId,
      loserId,
      scores: {
        red: scores.red,
        blue: scores.blue,
      },
      moves: [], // Replay moves list (can expand in future)
      duration: Math.floor((Date.now() - new Date(roomData.createdTime).getTime()) / 1000),
      date: new Date().toISOString(),
    };

    await setDoc(matchRef, matchHistoryDoc);
  };

  // Update profile metrics in Firestore
  const updateUserStatistics = async (roomData: Room) => {
    if (!profile) return;

    const userRef = doc(db, 'users', profile.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const stats = userData.stats || {
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

    const isWinner = roomData.winnerId === profile.uid;
    const isDraw = roomData.winnerId === 'draw';

    const newGamesPlayed = stats.gamesPlayed + 1;
    const newWins = stats.wins + (isWinner ? 1 : 0);
    const newDraws = stats.draws + (isDraw ? 1 : 0);
    const newLosses = stats.losses + (!isWinner && !isDraw ? 1 : 0);
    const newWinPercentage = Math.round((newWins / newGamesPlayed) * 100);
    
    // Update ranking score: win +15, loss -10, draw +2
    let newRating = stats.rating || 1200;
    if (isWinner) newRating += 15;
    else if (isDraw) newRating += 2;
    else newRating = Math.max(100, newRating - 10);

    await updateDoc(userRef, {
      status: 'online',
      'stats.gamesPlayed': newGamesPlayed,
      'stats.wins': newWins,
      'stats.draws': newDraws,
      'stats.losses': newLosses,
      'stats.winPercentage': newWinPercentage,
      'stats.rating': newRating,
      'stats.lastMatchDate': new Date().toISOString(),
    });
  };

  return (
    <GameContext.Provider
      value={{
        activeRoom,
        loadingRoom,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        makeMove,
        claimDisconnectVictory,
        opponentDisconnected,
        disconnectTimer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

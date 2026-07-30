import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';
import type { UserProfile, OnlineStatus } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileStatus: (status: OnlineStatus) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile details from Firestore
  const fetchAndSyncProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // First-time sign-in: Create profile using Google displayName
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Anonymous Player',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.uid}`,
          dateJoined: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: 'online',
          friends: [],
          friendRequests: [],
          stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winPercentage: 0,
            rating: 1200,
            createdRoomsCount: 0,
            joinedRoomsCount: 0,
            lastMatchDate: null,
          },
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      } else {
        // Subsequent sign-in: Update Google displayName, photoURL, lastSeen & status
        const existingData = userDocSnap.data() as UserProfile;
        const friends = existingData.friends || [];
        const friendRequests = existingData.friendRequests || [];

        const updatedProfile: UserProfile = {
          ...existingData,
          displayName: firebaseUser.displayName || existingData.displayName,
          photoURL: firebaseUser.photoURL || existingData.photoURL,
          lastSeen: new Date().toISOString(),
          status: 'online',
          friends,
          friendRequests,
        };

        await updateDoc(userDocRef, {
          displayName: updatedProfile.displayName,
          photoURL: updatedProfile.photoURL,
          lastSeen: updatedProfile.lastSeen,
          status: 'online',
          friends,
          friendRequests,
        });

        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    }
  };

  const updateProfileStatus = async (status: OnlineStatus) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        status,
        lastSeen: new Date().toISOString(),
      });
      setProfile((prev) => (prev ? { ...prev, status } : null));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchAndSyncProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Window unload listener to mark offline status when user leaves web app
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      const userDocRef = doc(db, 'users', user.uid);
      updateDoc(userDocRef, {
        status: 'offline',
        lastSeen: new Date().toISOString(),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          status: 'offline',
          lastSeen: new Date().toISOString(),
        });
      }
      await fbSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign-out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        updateProfileStatus,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

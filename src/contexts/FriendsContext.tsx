import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import type { UserProfile, GameInvite, ChatMessage } from '../types';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

interface FriendsContextType {
  friendsList: UserProfile[];
  pendingRequests: UserProfile[];
  selectedFriend: UserProfile | null;
  setSelectedFriend: (friend: UserProfile | null) => void;
  
  // Game Invite states
  incomingInvite: GameInvite | null;
  rejectedInviteFeedback: { friendName: string } | null;
  clearRejectedFeedback: () => void;
  sendGameInvite: (friendUid: string, roomCode: string) => Promise<void>;
  respondToInvite: (inviteId: string, accept: boolean) => Promise<void>;
  
  // Friend management actions
  searchUserByUsername: (username: string) => Promise<UserProfile[]>;
  sendFriendRequestByUsername: (username: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (senderUid: string) => Promise<void>;
  declineFriendRequest: (senderUid: string) => Promise<void>;
  removeFriend: (friendUid: string) => Promise<void>;

  // Direct chat drawer state
  activeChatFriend: UserProfile | null;
  setActiveChatFriend: (friend: UserProfile | null) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [friendsList, setFriendsList] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<UserProfile | null>(null);

  // Invite states
  const [incomingInvite, setIncomingInvite] = useState<GameInvite | null>(null);
  const [rejectedInviteFeedback, setRejectedInviteFeedback] = useState<{ friendName: string } | null>(null);

  // Chat state
  const [activeChatFriend, setActiveChatFriend] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 1. Real-time subscription to user's Friends & Friend Requests
  useEffect(() => {
    if (!user || !profile) {
      setFriendsList([]);
      setPendingRequests([]);
      return;
    }

    const friendsUids = profile.friends || [];
    const requestUids = profile.friendRequests || [];

    // Real-time listener for friends' profiles (status: online, in-game, offline)
    if (friendsUids.length > 0) {
      const q = query(collection(db, 'users'), where('uid', 'in', friendsUids.slice(0, 10)));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as UserProfile);
        });
        setFriendsList(list);
      });

      return () => unsub();
    } else {
      setFriendsList([]);
    }

    // Listener for pending request profiles
    if (requestUids.length > 0) {
      const q = query(collection(db, 'users'), where('uid', 'in', requestUids.slice(0, 10)));
      getDocs(q).then((snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as UserProfile);
        });
        setPendingRequests(list);
      });
    } else {
      setPendingRequests([]);
    }
  }, [user, profile?.friends, profile?.friendRequests]);

  // 2. Real-time subscription for incoming game invitations (Receiver)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'invites'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const inviteDoc = snapshot.docs[0];
        setIncomingInvite({ id: inviteDoc.id, ...inviteDoc.data() } as GameInvite);
      } else {
        setIncomingInvite(null);
      }
    });

    return () => unsub();
  }, [user]);

  // 3. Real-time subscription for sent game invitations rejection feedback (Sender)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'invites'),
      where('senderId', '==', user.uid),
      where('status', '==', 'rejected')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const inviteDoc = snapshot.docs[0];
        const inviteData = inviteDoc.data() as GameInvite;
        // Find friend name or use receiverId
        const friend = friendsList.find((f) => f.uid === inviteData.receiverId);
        setRejectedInviteFeedback({ friendName: friend ? friend.displayName : 'Player' });

        // Cleanup invite doc
        updateDoc(doc(db, 'invites', inviteDoc.id), { status: 'dismissed' });
      }
    });

    return () => unsub();
  }, [user, friendsList]);

  // 4. Real-time subscription for active direct chat
  useEffect(() => {
    if (!user || !activeChatFriend) {
      setChatMessages([]);
      return;
    }

    const chatId = [user.uid, activeChatFriend.uid].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      setChatMessages(msgs);
    });

    return () => unsub();
  }, [user, activeChatFriend]);

  // Send friend request by Google Account Username (displayName)
  const sendFriendRequestByUsername = async (username: string): Promise<{ success: boolean; message: string }> => {
    if (!user || !profile) return { success: false, message: 'Not logged in' };
    
    const cleanInput = username.trim();
    if (!cleanInput) return { success: false, message: 'Please enter a Google username' };

    try {
      // Search by exact displayName
      let q = query(collection(db, 'users'), where('displayName', '==', cleanInput));
      let snap = await getDocs(q);

      if (snap.empty) {
        // Case-insensitive fallback search across existing users
        const allUsersSnap = await getDocs(collection(db, 'users'));
        const foundDoc = allUsersSnap.docs.find((d) => {
          const u = d.data() as UserProfile;
          return u.displayName.toLowerCase() === cleanInput.toLowerCase();
        });

        if (!foundDoc) {
          return { success: false, message: `No player found with Google account "${cleanInput}"` };
        }

        const targetUser = foundDoc.data() as UserProfile;
        if (targetUser.uid === user.uid) {
          return { success: false, message: "You cannot add yourself!" };
        }

        if (profile.friends?.includes(targetUser.uid)) {
          return { success: false, message: `${targetUser.displayName} is already your friend!` };
        }

        const targetRef = doc(db, 'users', targetUser.uid);
        await updateDoc(targetRef, {
          friendRequests: arrayUnion(user.uid),
        });

        return { success: true, message: `Friend request sent to ${targetUser.displayName}!` };
      }

      const targetDoc = snap.docs[0];
      const targetUser = targetDoc.data() as UserProfile;

      if (targetUser.uid === user.uid) {
        return { success: false, message: "You cannot add yourself!" };
      }

      if (profile.friends?.includes(targetUser.uid)) {
        return { success: false, message: `${targetUser.displayName} is already your friend!` };
      }

      const targetRef = doc(db, 'users', targetUser.uid);
      await updateDoc(targetRef, {
        friendRequests: arrayUnion(user.uid),
      });

      return { success: true, message: `Friend request sent to ${targetUser.displayName}!` };
    } catch (e: any) {
      console.error(e);
      return { success: false, message: e.message || 'Failed to send request' };
    }
  };

  // Accept incoming request
  const acceptFriendRequest = async (senderUid: string) => {
    if (!user || !profile) return;

    try {
      const myRef = doc(db, 'users', user.uid);
      const senderRef = doc(db, 'users', senderUid);

      await updateDoc(myRef, {
        friends: arrayUnion(senderUid),
        friendRequests: arrayRemove(senderUid),
      });

      await updateDoc(senderRef, {
        friends: arrayUnion(user.uid),
      });

      await refreshProfile();
    } catch (e) {
      console.error('Failed to accept request:', e);
    }
  };

  // Decline incoming request
  const declineFriendRequest = async (senderUid: string) => {
    if (!user) return;

    try {
      const myRef = doc(db, 'users', user.uid);
      await updateDoc(myRef, {
        friendRequests: arrayRemove(senderUid),
      });
      await refreshProfile();
    } catch (e) {
      console.error('Failed to decline request:', e);
    }
  };

  // Remove friend
  const removeFriend = async (friendUid: string) => {
    if (!user) return;

    try {
      const myRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', friendUid);

      await updateDoc(myRef, {
        friends: arrayRemove(friendUid),
      });
      await updateDoc(friendRef, {
        friends: arrayRemove(user.uid),
      });

      await refreshProfile();
      setSelectedFriend(null);
    } catch (e) {
      console.error('Failed to remove friend:', e);
    }
  };

  // Dispatch game invite directly
  const sendGameInvite = async (friendUid: string, roomCode: string) => {
    if (!user || !profile) return;

    try {
      await addDoc(collection(db, 'invites'), {
        senderId: user.uid,
        senderName: profile.displayName,
        senderPhoto: profile.photoURL,
        receiverId: friendUid,
        roomCode,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to send game invite:', e);
    }
  };

  // Respond to game invite (Accept or Reject)
  const respondToInvite = async (inviteId: string, accept: boolean) => {
    try {
      const inviteRef = doc(db, 'invites', inviteId);
      await updateDoc(inviteRef, {
        status: accept ? 'accepted' : 'rejected',
      });
      setIncomingInvite(null);
    } catch (e) {
      console.error('Failed to respond to invite:', e);
    }
  };

  const clearRejectedFeedback = () => {
    setRejectedInviteFeedback(null);
  };

  // Send direct chat message
  const sendChatMessage = async (text: string) => {
    if (!user || !profile || !activeChatFriend || !text.trim()) return;

    const chatId = [user.uid, activeChatFriend.uid].sort().join('_');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        chatId,
        senderId: user.uid,
        senderName: profile.displayName,
        receiverId: activeChatFriend.uid,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  };

  // Search users by Google Username — partial/substring match, returns multiple results
  const searchUserByUsername = async (username: string): Promise<UserProfile[]> => {
    if (!username.trim() || !user) return [];
    const cleanInput = username.trim().toLowerCase();
    try {
      // Firestore doesn't support substring queries natively,
      // so fetch all users and filter client-side for partial matching
      const allSnap = await getDocs(collection(db, 'users'));
      const results: UserProfile[] = [];

      allSnap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.uid === user.uid) return; // exclude self
        if (u.displayName.toLowerCase().includes(cleanInput)) {
          results.push(u);
        }
      });

      // Sort: prefix matches first, then substring matches
      results.sort((a, b) => {
        const aStartsWith = a.displayName.toLowerCase().startsWith(cleanInput) ? 0 : 1;
        const bStartsWith = b.displayName.toLowerCase().startsWith(cleanInput) ? 0 : 1;
        return aStartsWith - bStartsWith;
      });

      return results.slice(0, 10); // cap at 10 results
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  return (
    <FriendsContext.Provider
      value={{
        friendsList,
        pendingRequests,
        selectedFriend,
        setSelectedFriend,
        incomingInvite,
        rejectedInviteFeedback,
        clearRejectedFeedback,
        sendGameInvite,
        respondToInvite,
        searchUserByUsername,
        sendFriendRequestByUsername,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        activeChatFriend,
        setActiveChatFriend,
        chatMessages,
        sendChatMessage,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

import React, { useState, useRef, useEffect } from 'react';
import { useFriends } from '../contexts/FriendsContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare } from 'lucide-react';

export const DirectChatModal: React.FC = () => {
  const { activeChatFriend, setActiveChatFriend, chatMessages, sendChatMessage } = useFriends();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!activeChatFriend || !user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendChatMessage(text.trim());
    setText('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveChatFriend(null)}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Chat Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-sm rounded-3xl bg-[#0f172a] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col h-[520px] z-10"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-3">
              <img
                src={activeChatFriend.photoURL}
                alt={activeChatFriend.displayName}
                className="w-10 h-10 rounded-full border border-white/20 object-cover"
              />
              <div>
                <h3 className="font-display font-black text-sm text-white truncate max-w-[160px]">
                  {activeChatFriend.displayName}
                </h3>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Direct Chat
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveChatFriend(null)}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold">No messages yet. Say hi!</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${
                        isMe
                          ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-slate-900/90 flex items-center gap-2">
            <input
              id="direct-chat-message-input"
              name="chatMessage"
              type="text"
              placeholder={`Message ${activeChatFriend.displayName}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-95 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DirectChatModal;

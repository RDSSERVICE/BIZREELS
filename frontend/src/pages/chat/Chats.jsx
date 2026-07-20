import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiPaperclip, FiMic, FiPhone, FiVideo, FiMoreVertical, FiCircle, FiUser } from 'react-icons/fi';
import { selectCurrentUser, selectAccessToken } from '../../features/auth/authSlice';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation
} from '../../features/chat/chatApi';
import API_CONFIG from '../../config';
import { tokenStore } from '../../lib/api';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

const Chats = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectAccessToken);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [chatFilter, setChatFilter] = useState('all'); // all | vendor | creator

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // RTK Query calls
  const { data: convsRes, isLoading: isConvsLoading, refetch: refetchConvs } = useGetConversationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { data: msgHistoryRes, isLoading: isHistoryLoading, refetch: refetchHistory } = useGetMessagesQuery(
    { conversationId: activeConversationId },
    { skip: !activeConversationId, refetchOnMountOrArgChange: true }
  );

  const [sendMessageApi] = useSendMessageMutation();

  const conversations = convsRes?.conversations || [];
  
  const filteredConversations = conversations.filter((c) => {
    if (chatFilter === 'all') return true;
    const peer = c.participants.find((p) => p._id !== user?._id);
    return peer?.activeRole === chatFilter;
  });

  // ── Initialize Socket connection ────────────────────────
  useEffect(() => {
    const authToken = token || tokenStore.getAccess();
    if (!authToken) return;

    const socket = io(API_CONFIG.SOCKET_URL, {
      auth: { token: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}` },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      logger.info('Connected to chat sockets server.', { service: 'sockets' });
    });

    // Real time incoming message alerts
    socket.on('message', (message) => {
      if (message.conversation === activeConversationId) {
        setMessages((prev) => [...prev, message]);
        // Settle seen status
        socket.emit('mark_seen', { conversationId: activeConversationId });
      }
      refetchConvs();
    });

    socket.on('message_alert', () => {
      refetchConvs();
    });

    // Typing broadcasts
    socket.on('typing', ({ conversationId, userName }) => {
      if (conversationId === activeConversationId) {
        setTypingUser(userName);
      }
    });

    socket.on('stop_typing', ({ conversationId }) => {
      if (conversationId === activeConversationId) {
        setTypingUser(null);
      }
    });

    socket.on('messages_seen', () => {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, isSeen: true }))
      );
      refetchConvs();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeConversationId]);

  // Sync loaded history messages
  useEffect(() => {
    if (msgHistoryRes) {
      setMessages(msgHistoryRes);
    }
  }, [msgHistoryRes]);

  // Auto-scroll to bottom of chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // Join/leave socket conversation rooms on change
  useEffect(() => {
    if (!socketRef.current || !activeConversationId) return;

    socketRef.current.emit('join_conversation', activeConversationId);
    // Mark seen
    socketRef.current.emit('mark_seen', { conversationId: activeConversationId });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_conversation', activeConversationId);
      }
    };
  }, [activeConversationId]);

  // Typing debouncer
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!socketRef.current || !activeConversationId) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', { conversationId: activeConversationId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('stop_typing', { conversationId: activeConversationId });
    }, 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversationId) return;

    const activeConv = conversations.find((c) => c._id === activeConversationId);
    const recipient = activeConv?.participants.find((p) => p._id !== user._id);
    if (!recipient) return;

    try {
      setMessageText('');
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { conversationId: activeConversationId });
      }
      setIsTyping(false);

      await sendMessageApi({
        recipientId: recipient._id,
        text: messageText,
      }).unwrap();

      refetchConvs();
    } catch (err) {
      toast.error('Failed to deliver message.');
    }
  };

  // Get active chat profile data
  const getActiveChatDetails = () => {
    const activeConv = conversations.find((c) => c._id === activeConversationId);
    const peer = activeConv?.participants.find((p) => p._id !== user._id);
    return { name: peer?.name || 'Store Chat', avatar: peer?.avatarUrl, role: peer?.activeRole };
  };

  const activeChat = activeConversationId ? getActiveChatDetails() : null;

  return (
    <div className="glass h-[calc(100vh-140px)] rounded-premium border-white/50 shadow-glass overflow-hidden grid grid-cols-1 md:grid-cols-3">
      {/* ── Left side: Conversations thread list ────────────────── */}
      <div className="border-r border-border flex flex-col h-full bg-surface-secondary/20">
        <div className="p-4 border-b border-border flex flex-col gap-2">
          <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider font-display">
            Inbox Messages
          </h3>
          <div className="flex bg-surface-tertiary p-0.5 rounded-premium text-[10px] font-bold">
            <button
              onClick={() => setChatFilter('all')}
              className={`flex-grow py-1 rounded-premium text-center cursor-pointer transition-all
                ${chatFilter === 'all' ? 'bg-white text-brand-purple shadow-sm' : 'text-text-secondary'}
              `}
            >
              All
            </button>
            <button
              onClick={() => setChatFilter('vendor')}
              className={`flex-grow py-1 rounded-premium text-center cursor-pointer transition-all
                ${chatFilter === 'vendor' ? 'bg-white text-brand-purple shadow-sm' : 'text-text-secondary'}
              `}
            >
              Vendors Chat
            </button>
            <button
              onClick={() => setChatFilter('creator')}
              className={`flex-grow py-1 rounded-premium text-center cursor-pointer transition-all
                ${chatFilter === 'creator' ? 'bg-white text-brand-purple shadow-sm' : 'text-text-secondary'}
              `}
            >
              Service Provider Chat
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {isConvsLoading ? (
            <div className="flex justify-center py-8"><Loader /></div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-xs text-text-tertiary">
              No matching conversation channels active.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const peer = c.participants.find((p) => p._id !== user?._id);
              const unread = c.unreadCount?.[user?._id] || 0;
              const isSelected = activeConversationId === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setActiveConversationId(c._id)}
                  className={`p-3 rounded-premium flex items-center justify-between cursor-pointer transition-all hover:bg-surface-tertiary
                    ${isSelected ? 'bg-brand-purple/10 border-l-4 border-brand-purple' : 'border-l-4 border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={peer?.avatarUrl || 'https://via.placeholder.com/150'}
                      alt={peer?.name}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                        {peer?.name}
                        {peer?.activeRole && peer?.activeRole !== 'customer' && (
                          <span className="px-1 text-[8px] font-black uppercase tracking-wider text-white bg-brand-pink rounded">
                            {peer.activeRole === 'creator' ? 'creator' : peer.activeRole}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-text-secondary line-clamp-1">
                        {c.lastMessage?.text || 'Sent media attachment'}
                      </span>
                    </div>
                  </div>

                  {unread > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center bg-brand-orange text-white text-[9px] font-black rounded-full shrink-0">
                      {unread}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right side: Chat Screen window ──────────────────────── */}
      <div className="md:col-span-2 flex flex-col h-full bg-white relative">
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary select-none">
            <FiSend className="w-12 h-12 text-brand-purple/20 mb-2 rotate-45" />
            <p className="font-bold text-brand-navy">Select a Conversation</p>
            <p className="text-xs mt-1">Review vendor inquiries, creator briefs, and negotiate pricing details in real time.</p>
          </div>
        ) : (
          <>
            {/* Header profile details */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-secondary/20">
              <div className="flex items-center gap-3">
                <img
                  src={activeChat.avatar || 'https://via.placeholder.com/150'}
                  alt={activeChat.name}
                  className="w-9 h-9 rounded-full object-cover border border-brand-purple/20"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                    {activeChat.name}
                    {activeChat.role && activeChat.role !== 'customer' && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase text-white bg-brand-pink rounded">
                        {activeChat.role}
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] text-success font-semibold flex items-center gap-1">
                    <FiCircle className="w-1.5 h-1.5 fill-success" /> Active
                  </span>
                </div>
              </div>

              <div className="flex gap-2 text-text-secondary">
                <button className="p-2 hover:bg-surface-tertiary rounded-full cursor-pointer"><FiPhone /></button>
                <button className="p-2 hover:bg-surface-tertiary rounded-full cursor-pointer"><FiVideo /></button>
                <button className="p-2 hover:bg-surface-tertiary rounded-full cursor-pointer"><FiMoreVertical /></button>
              </div>
            </div>

            {/* Message lists viewport */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none bg-surface-secondary/10">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full"><Loader /></div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] flex flex-col gap-1`}>
                        <div className={`p-3 rounded-premium text-xs leading-relaxed shadow-sm
                          ${isOwn 
                            ? 'bg-brand-purple text-white rounded-tr-none' 
                            : 'bg-white text-brand-navy rounded-tl-none border border-border'
                          }
                        `}>
                          {msg.text}
                        </div>
                        <span className={`text-[8px] text-text-tertiary px-1 flex items-center gap-1.5
                          ${isOwn ? 'self-end justify-end' : 'self-start justify-start'}
                        `}>
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && (
                            <span className={msg.isSeen ? 'text-brand-purple font-black' : ''}>
                              • {msg.isSeen ? 'Read' : 'Sent'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUser && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border p-3 rounded-premium rounded-tl-none text-[10px] text-text-secondary italic flex items-center gap-1.5 animate-pulse">
                    <span>{typingUser} is typing</span>
                    <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Messaging Input bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-border flex items-center gap-2 bg-white">
              <button type="button" className="p-2 text-text-secondary hover:bg-surface-secondary rounded-full cursor-pointer">
                <FiPaperclip className="w-5 h-5" />
              </button>
              
              <input
                type="text"
                placeholder="Type your message..."
                value={messageText}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 bg-surface-secondary border border-border focus:border-brand-purple rounded-full text-xs focus:outline-none"
              />

              <button type="button" className="p-2 text-text-secondary hover:bg-surface-secondary rounded-full cursor-pointer">
                <FiMic className="w-5 h-5" />
              </button>
              
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="p-2.5 bg-brand-purple text-white rounded-full cursor-pointer hover:bg-brand-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Chats;

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiPaperclip, FiMic, FiPhone, FiVideo, FiMoreVertical, FiCircle, FiUser, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { selectCurrentUser, selectAccessToken } from '../../features/auth/authSlice';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useClearChatMutation,
  useDeleteConversationMutation,
  useDeleteMessageForMeMutation,
  useDeleteMessageForEveryoneMutation
} from '../../features/chat/chatApi';
import API_CONFIG from '../../config';
import { tokenStore } from '../../lib/api';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

const Chats = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectAccessToken);
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('userId');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [chatFilter, setChatFilter] = useState('all'); // all | vendor | creator
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [deleteMessageModal, setDeleteMessageModal] = useState(null);

  const [clearChatApi] = useClearChatMutation();
  const [deleteConversationApi] = useDeleteConversationMutation();
  const [deleteMessageForMeApi] = useDeleteMessageForMeMutation();
  const [deleteMessageForEveryoneApi] = useDeleteMessageForEveryoneMutation();

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // RTK Query calls
  const { data: convsRes, isLoading: isConvsLoading, refetch: refetchConvs } = useGetConversationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const isTemp = typeof activeConversationId === 'string' && activeConversationId.startsWith('temp-');

  const { data: msgHistoryRes, isLoading: isHistoryLoading, refetch: refetchHistory } = useGetMessagesQuery(
    { conversationId: activeConversationId },
    { skip: !activeConversationId || isTemp, refetchOnMountOrArgChange: true }
  );

  const [sendMessageApi] = useSendMessageMutation();

  const conversations = convsRes?.conversations || [];

  // Prepend temporary conversation thread if starting a chat with someone new
  const hasExisting = conversations.some((c) =>
    c.participants.some((p) => p._id === queryUserId)
  );

  const filteredConversations = [...conversations].filter((c) => {
    if (chatFilter === 'all') return true;
    const peer = c.participants.find((p) => p._id !== user?._id);
    return peer?.activeRole === chatFilter;
  });

  if (queryUserId && !hasExisting) {
    const queryName = searchParams.get('name') || 'New Client';
    const queryAvatar = searchParams.get('avatar') || null;
    filteredConversations.unshift({
      _id: `temp-${queryUserId}`,
      participants: [
        { _id: user?._id, name: user?.name, avatarUrl: user?.avatarUrl },
        { _id: queryUserId, name: queryName, avatarUrl: queryAvatar, activeRole: 'vendor' }
      ],
      lastMessage: { text: 'Start typing to begin messaging...' },
      unreadCount: {}
    });
  }

  // ── Initialize Socket connection ────────────────────────
  useEffect(() => {
    const authToken = token || '';
    if (!authToken && !user) return;

    const socket = io(API_CONFIG.SOCKET_URL, {
      auth: authToken ? { token: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}` } : undefined,
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat sockets server.');
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

    socket.on('message_deleted', ({ messageId, text }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, text, isDeleted: true }
            : msg
        )
      );
      refetchConvs();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeConversationId]);

  // Sync loaded history messages
  useEffect(() => {
    if (isTemp) {
      setMessages([]);
    } else if (msgHistoryRes) {
      setMessages(msgHistoryRes);
    }
  }, [msgHistoryRes, isTemp]);

  // Auto-select or pre-load conversation from query parameters on mount or when conversations load
  useEffect(() => {
    if (queryUserId && filteredConversations.length > 0 && !activeConversationId) {
      const match = filteredConversations.find((c) =>
        c.participants.some((p) => p._id === queryUserId)
      );
      if (match) {
        setActiveConversationId(match._id);
      }
    }
  }, [queryUserId, filteredConversations, activeConversationId]);

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

    let recipientId;
    if (isTemp) {
      recipientId = activeConversationId.replace('temp-', '');
    } else {
      const activeConv = filteredConversations.find((c) => c._id === activeConversationId);
      const recipient = activeConv?.participants.find((p) => p._id !== user._id);
      if (!recipient) return;
      recipientId = recipient._id;
    }

    try {
      setMessageText('');
      if (socketRef.current && !isTemp) {
        socketRef.current.emit('stop_typing', { conversationId: activeConversationId });
      }
      setIsTyping(false);

      const res = await sendMessageApi({
        recipientId,
        text: messageText,
      }).unwrap();

      if (isTemp) {
        const newConvId = res.message?.conversation || res.data?.message?.conversation || res.data?.conversationId || res.conversationId;
        if (newConvId) {
          setActiveConversationId(newConvId);
        }
      }

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
      <div className={`border-r border-border flex flex-col h-full bg-surface-secondary/20 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
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
      <div className={`md:col-span-2 flex flex-col h-full bg-white relative ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
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
                <button
                  onClick={() => setActiveConversationId(null)}
                  className="p-1.5 hover:bg-surface-tertiary rounded-full text-text-secondary md:hidden"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
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

              <div className="flex gap-2 text-text-secondary items-center relative">
                <button className="p-2 hover:bg-surface-tertiary rounded-full cursor-pointer"><FiPhone /></button>
                <button className="p-2 hover:bg-surface-tertiary rounded-full cursor-pointer"><FiVideo /></button>
                <div className="relative">
                  <button
                    onClick={() => setIsHeaderMenuOpen(prev => !prev)}
                    className="p-2 hover:bg-surface-tertiary rounded-full cursor-pointer text-text-secondary flex items-center justify-center"
                  >
                    <FiMoreVertical />
                  </button>
                  {isHeaderMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-premium shadow-lg z-50 py-1 text-xs text-brand-navy">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsHeaderMenuOpen(false);
                          if (window.confirm('Are you sure you want to clear this chat history? This cannot be undone.')) {
                            try {
                              await clearChatApi(activeConversationId).unwrap();
                              setMessages([]);
                              toast.success('Chat cleared.');
                              refetchConvs();
                            } catch (err) {
                              toast.error('Failed to clear chat.');
                            }
                          }
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-surface-secondary cursor-pointer transition-colors"
                      >
                        Clear Messages
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsHeaderMenuOpen(false);
                          if (window.confirm('Are you sure you want to delete this chat conversation? This will delete all messages for you and remove the chat from your list.')) {
                            try {
                              await deleteConversationApi(activeConversationId).unwrap();
                              setActiveConversationId(null);
                              toast.success('Chat deleted.');
                              refetchConvs();
                            } catch (err) {
                              toast.error('Failed to delete chat.');
                            }
                          }
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-surface-secondary text-brand-orange cursor-pointer transition-colors"
                      >
                        Delete Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message lists viewport */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none bg-surface-secondary/10">
              {isHistoryLoading ? (
                <div className="flex justify-center items-center h-full"><Loader /></div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.sender?._id === user._id || msg.sender === user._id;
                  const isDeleted = msg.isDeleted || msg.text === 'This message was deleted';
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex group ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] flex flex-col gap-1 relative`}>
                        <div className="flex items-center gap-1.5 group">
                          {isOwn && !isDeleted && (
                            <button
                              type="button"
                              onClick={() => setDeleteMessageModal(msg)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-brand-orange text-text-tertiary transition-opacity cursor-pointer flex items-center justify-center"
                              title="Delete Message"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className={`p-3 rounded-premium text-xs leading-relaxed shadow-sm
                            ${isDeleted
                              ? 'bg-surface-tertiary text-text-tertiary italic rounded-premium border border-border'
                              : isOwn 
                                ? 'bg-brand-purple text-white rounded-tr-none' 
                                : 'bg-white text-brand-navy rounded-tl-none border border-border'
                            }
                          `}>
                            {msg.text}
                          </div>
                          {!isOwn && !isDeleted && (
                            <button
                              type="button"
                              onClick={() => setDeleteMessageModal(msg)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-brand-orange text-text-tertiary transition-opacity cursor-pointer flex items-center justify-center"
                              title="Delete Message"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <span className={`text-[8px] text-text-tertiary px-1 flex items-center gap-1.5
                          ${isOwn ? 'self-end justify-end' : 'self-start justify-start'}
                        `}>
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && !isDeleted && (
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

      {/* Delete Message Modal Overlay */}
      {deleteMessageModal && (
        <div className="fixed inset-0 bg-brand-navy/30 backdrop-blur-xs flex items-center justify-center z-[100]">
          <div className="bg-white border border-border p-6 rounded-premium shadow-glass max-w-sm w-full mx-4 text-brand-navy flex flex-col gap-4">
            <h4 className="text-sm font-bold font-display uppercase tracking-wide">Delete Message?</h4>
            <p className="text-xs text-text-secondary">Are you sure you want to delete this message?</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  const msgId = deleteMessageModal._id;
                  setDeleteMessageModal(null);
                  try {
                    await deleteMessageForMeApi(msgId).unwrap();
                    setMessages(prev => prev.filter(m => m._id !== msgId));
                    toast.success('Deleted for you.');
                    refetchConvs();
                  } catch (err) {
                    toast.error('Failed to delete message.');
                  }
                }}
                className="w-full py-2 bg-surface-tertiary hover:bg-surface-secondary text-brand-navy font-bold rounded-premium text-xs cursor-pointer transition-colors"
              >
                Delete for me
              </button>
              {(deleteMessageModal.sender?._id === user._id || deleteMessageModal.sender === user._id) && (
                <button
                  type="button"
                  onClick={async () => {
                    const msgId = deleteMessageModal._id;
                    setDeleteMessageModal(null);
                    try {
                      await deleteMessageForEveryoneApi(msgId).unwrap();
                      setMessages(prev =>
                        prev.map(m =>
                          m._id === msgId
                            ? { ...m, text: 'This message was deleted', isDeleted: true }
                            : m
                        )
                      );
                      toast.success('Deleted for everyone.');
                      refetchConvs();
                    } catch (err) {
                      toast.error('Failed to delete message for everyone.');
                    }
                  }}
                  className="w-full py-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold rounded-premium text-xs cursor-pointer transition-colors"
                >
                  Delete for everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteMessageModal(null)}
                className="w-full py-2 border border-border hover:bg-surface-secondary text-text-secondary font-semibold rounded-premium text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chats;

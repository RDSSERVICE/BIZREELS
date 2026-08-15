import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiMessageSquare, FiBriefcase, FiTool, FiSend, FiUser, FiCheck,
  FiSearch, FiPaperclip, FiPhoneCall, FiMoreVertical, FiClock, FiShield, FiPlusSquare,
  FiTrash2, FiBellOff, FiInfo, FiExternalLink, FiArrowLeft
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { getSocket } from '../../../lib/socket';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useClearChatMutation,
  useDeleteConversationMutation
} from '../../../features/chat/chatApi';

const TABS = [
  { key: 'vendors', label: 'Vendor Messages', icon: FiBriefcase },
  { key: 'service-providers', label: 'Service Provider Chats', icon: FiTool },
];

export default function CustomerChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('userId') || searchParams.get('vendorId');
  const queryName = searchParams.get('name');
  const queryAvatar = searchParams.get('avatar');

  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?._id || currentUser?.id;
  const [activeTab, setActiveTab] = useState('vendors');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasCheckedQuery, setHasCheckedQuery] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset check when queryUserId changes
  useEffect(() => {
    setHasCheckedQuery(false);
  }, [queryUserId]);

  // RTK Query hooks with 5m polling for real-time sync
  const { data: convData, isFetching: isConvLoading, refetch: refetchConvs } = useGetConversationsQuery(undefined, { pollingInterval: 300000 });
  const [sendMessageApi, { isLoading: isSending }] = useSendMessageMutation();
  const [clearChatApi, { isLoading: isClearing }] = useClearChatMutation();
  const [deleteConversationApi, { isLoading: isDeletingConvs }] = useDeleteConversationMutation();

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConvs, setSelectedConvs] = useState({});
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const fileInputRef = useRef(null);
  const [mutedThreads, setMutedThreads] = useState(() => {
    try {
      const saved = localStorage.getItem('muted_threads');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const conversationsList = convData?.data?.conversations || convData?.conversations || convData?.data || (Array.isArray(convData) ? convData : []);

  // Process live database threads
  const baseThreads = conversationsList.map((c) => {
    const participants = c.participants || [];
    const other = participants.find((p) => (p._id || p.id || p) !== currentUserId) || {};
    const recipientId = other._id || other.id || (typeof other === 'string' ? other : null);
    const name = other.name || other.shopName || other.businessName || 'Vendor';
    const avatar = other.avatarUrl || other.profile_pic || other.vendorProfile?.logo || null;
    const isService = other.activeRole === 'service-provider' || other.roles?.includes('creator') || false;

    return {
      id: c._id || c.id,
      name,
      avatar,
      lastMessage: c.lastMessage?.text || c.lastMessage?.content || 'No messages yet',
      time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      unread: c.unreadCount || 0,
      recipientId,
      role: isService ? 'service-providers' : 'vendors',
      rawConversation: c,
    };
  });

  const hasExisting = baseThreads.some((t) => t.recipientId === queryUserId);
  const liveThreads = [...baseThreads];

  if (queryUserId && !hasExisting) {
    liveThreads.unshift({
      id: `temp-${queryUserId}`,
      name: queryName || 'Vendor',
      avatar: queryAvatar || null,
      lastMessage: 'Start typing to begin conversation...',
      time: 'Now',
      unread: 0,
      recipientId: queryUserId,
      role: 'vendors',
      isVirtual: true,
    });
  }

  const filteredThreads = liveThreads.filter((t) => {
    const matchesTab = activeTab === 'vendors' ? t.role !== 'service-providers' : t.role === 'service-providers';
    const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Auto-select thread based on query param or select first thread if none selected
  useEffect(() => {
    if (queryUserId && !hasCheckedQuery && liveThreads.length > 0) {
      const targetThread = liveThreads.find((t) => t.recipientId === queryUserId);
      if (targetThread) {
        setSelectedThreadId(targetThread.id);
        if (targetThread.role) {
          setActiveTab(targetThread.role);
        }
        setHasCheckedQuery(true);
      }
    } else if (!queryUserId && !selectedThreadId && filteredThreads.length > 0) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [queryUserId, hasCheckedQuery, liveThreads, filteredThreads, selectedThreadId]);

  const currentThread = filteredThreads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || {};

  // Fetch real message history for selected thread, skipping virtual ones
  const { data: msgData, isFetching: isMsgLoading, refetch: refetchMessages } = useGetMessagesQuery(
    { conversationId: selectedThreadId },
    { skip: !selectedThreadId || String(selectedThreadId).startsWith('temp-'), pollingInterval: 300000 }
  );

  // Real-time Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const isTemp = selectedThreadId && String(selectedThreadId).startsWith('temp-');

    if (selectedThreadId && !isTemp) {
      socket.emit('join_conversation', selectedThreadId);
      socket.emit('mark_seen', { conversationId: selectedThreadId });
    }

    const handleIncomingMessage = (msg) => {
      const msgConvId = msg.conversationId || msg.conversation || msg.conversation?._id;
      if (msgConvId === selectedThreadId) {
        if (typeof refetchMessages === 'function') refetchMessages();
      }
      refetchConvs();
    };

    socket.on('message', handleIncomingMessage);
    socket.on('chat_message', handleIncomingMessage);
    socket.on('message_alert', () => refetchConvs());

    return () => {
      if (selectedThreadId && !isTemp) {
        socket.emit('leave_conversation', selectedThreadId);
      }
      socket.off('message', handleIncomingMessage);
      socket.off('chat_message', handleIncomingMessage);
      socket.off('message_alert');
    };
  }, [selectedThreadId, refetchMessages, refetchConvs]);

  // Auto-scroll to bottom of chat history
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgData, selectedThreadId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentThread.recipientId) {
      if (!currentThread.recipientId) {
        toast.error('Cannot find recipient for this conversation');
      }
      return;
    }

    const text = messageInput.trim();
    setMessageInput('');

    try {
      const res = await sendMessageApi({
        recipientId: currentThread.recipientId,
        text,
      }).unwrap();

      const socket = getSocket();
      const newConversationId = res.data?.message?.conversationId || res.data?.message?.conversation || res.message?.conversationId || res.message?.conversation;

      if (socket && newConversationId) {
        socket.emit('send_message', { conversationId: newConversationId, text });
      }

      if (newConversationId) {
        setSelectedThreadId(newConversationId);
      }

      if (typeof refetchMessages === 'function') refetchMessages();
      refetchConvs();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send message');
    }
  };

  const handleToggleSelectConv = (id) => {
    setSelectedConvs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteSelectedConvs = async () => {
    const idsToDelete = Object.keys(selectedConvs).filter((id) => selectedConvs[id]);
    if (idsToDelete.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete the ${idsToDelete.length} selected conversations? This action cannot be undone.`)) {
      return;
    }

    const toastId = toast.loading(`Deleting ${idsToDelete.length} chats...`);
    try {
      await Promise.all(
        idsToDelete.map((id) => {
          if (String(id).startsWith('temp-')) {
            return Promise.resolve();
          }
          return deleteConversationApi(id).unwrap();
        })
      );
      toast.success('Selected conversations deleted successfully!', { id: toastId });
      setSelectedConvs({});
      setIsEditMode(false);
      setSelectedThreadId(null);
      refetchConvs();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete conversations', { id: toastId });
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedThreadId || String(selectedThreadId).startsWith('temp-')) {
      toast.error('No active conversation to delete');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this chat conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteConversationApi(selectedThreadId).unwrap();
      toast.success('Conversation deleted!');
      setSelectedThreadId(null);
      refetchConvs();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete conversation');
    }
  };

  const handleToggleMute = (threadId) => {
    setMutedThreads((prev) => {
      const updated = { ...prev, [threadId]: !prev[threadId] };
      localStorage.setItem('muted_threads', JSON.stringify(updated));
      if (updated[threadId]) {
        toast.success(`Notifications muted for ${currentThread.name || 'this conversation'}`);
      } else {
        toast.success(`Notifications unmuted for ${currentThread.name || 'this conversation'}`);
      }
      return updated;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading image attachment...');
    try {
      const res = await api.post('/v1/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const imageUrl = res.data.url;
      toast.success('Image uploaded successfully!', { id: toastId });
      
      // Auto-send image
      await sendMessageApi({
        recipientId: currentThread.recipientId,
        text: 'Sent an image attachment.',
        media: imageUrl,
      }).unwrap();

      const socket = getSocket();
      if (socket && selectedThreadId && !String(selectedThreadId).startsWith('temp-')) {
        socket.emit('send_message', { conversationId: selectedThreadId, text: 'Sent an image attachment.', media: imageUrl });
      }

      if (typeof refetchMessages === 'function') refetchMessages();
      refetchConvs();
    } catch (err) {
      toast.error('Failed to upload image attachment', { id: toastId });
    }
  };

  const handleClearChat = async () => {
    if (!selectedThreadId || String(selectedThreadId).startsWith('temp-')) {
      toast.error('No active messages to clear in this chat');
      return;
    }

    try {
      await clearChatApi(selectedThreadId).unwrap();
      toast.success('Chat history cleared!');
      if (typeof refetchMessages === 'function') refetchMessages();
      refetchConvs();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clear chat history');
    }
  };

  const rawMessagesList = msgData?.data?.messages || msgData?.data || (Array.isArray(msgData) ? msgData : []);

  const activeMessages = rawMessagesList.map((m) => {
    const senderId = m.senderId || m.sender?._id || m.sender;
    const isMine = String(senderId) === String(currentUserId);

    return {
      id: m._id || m.id,
      sender: isMine ? 'customer' : 'other',
      text: m.text || m.content || '',
      media: m.media,
      time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    };
  });

  const filteredMessages = activeMessages.filter((m) => {
    if (!chatSearchQuery.trim()) return true;
    return m.text.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 animate-fade-in p-2 sm:p-4 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">REALTIME MESSAGING</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            MESSAGES &amp; DIRECT CHATS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Connect in real-time with verified vendors and service providers.
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiMessageSquare size={20} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelectedThreadId(null);
              }}
              className={`px-3 py-2 rounded-md text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                  : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#d99a3d]' : 'text-slate-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dual Pane Glass Chat Interface */}
      <div className="glass rounded-3xl border border-white/50 shadow-card flex flex-col md:flex-row h-[600px] overflow-hidden">
        {/* Left Thread Sidebar */}
        <div className={`w-full md:w-80 border-r border-border bg-surface-secondary/40 flex flex-col ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Box & Edit Actions */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-3 text-text-tertiary w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-purple"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  setSelectedConvs({});
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  isEditMode
                    ? 'bg-brand-purple text-white shadow-premium'
                    : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {isEditMode ? 'Cancel' : 'Select'}
              </button>
            </div>

            {isEditMode && (
              <div className="flex items-center justify-between gap-2 px-1 py-0.5 border-t border-border/50 pt-2 animate-fade-in">
                <span className="text-[10px] text-text-tertiary font-bold">
                  {Object.values(selectedConvs).filter(Boolean).length} Selected
                </span>
                <button
                  type="button"
                  onClick={handleDeleteSelectedConvs}
                  disabled={isDeletingConvs || Object.values(selectedConvs).filter(Boolean).length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <FiTrash2 size={12} />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isConvLoading && filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-tertiary">
                Loading live conversations...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-tertiary space-y-2">
                <p className="font-semibold text-text-secondary">No active chats found</p>
                <p className="text-[11px]">Inquire on listings or requirements to start a conversation!</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = selectedThreadId === t.id;
                const isChecked = !!selectedConvs[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (isEditMode) {
                        handleToggleSelectConv(t.id);
                      } else {
                        setSelectedThreadId(t.id);
                      }
                    }}
                    className={`w-full p-3 rounded-2xl text-left transition-all duration-200 flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-brand-purple text-white shadow-premium border-transparent'
                        : 'border-transparent text-text-secondary hover:bg-brand-purple/5 hover:text-text-primary'
                    }`}
                  >
                    {isEditMode && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectConv(t.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded text-brand-purple focus:ring-brand-purple border-border cursor-pointer shrink-0"
                      />
                    )}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                        isSelected ? 'bg-white/20 text-white' : 'gradient-brand text-white'
                      }`}
                    >
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        t.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate flex items-center gap-1.5 ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                          <span>{t.name}</span>
                          {mutedThreads[t.id] && <FiBellOff size={11} className={isSelected ? 'text-white/70' : 'text-text-tertiary'} />}
                        </h4>
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-tertiary'}`}>
                          {t.time}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-text-tertiary'}`}>
                        {t.lastMessage}
                      </p>
                    </div>
                    {t.unread > 0 && !isEditMode && (
                      <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {t.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Area */}
        {filteredThreads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface/80 gap-4">
            <div className="p-4 rounded-3xl bg-brand-purple/10 text-brand-purple shadow-sm">
              <FiMessageSquare className="w-10 h-10" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-text-primary font-display">No Conversations Yet</h3>
              <p className="text-xs text-text-tertiary">
                Your direct chat messages with vendors and service providers will appear here in real-time.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => navigate('/customer/search')}
                className="px-5 py-2.5 rounded-xl gradient-brand text-white text-xs font-bold shadow-premium hover:opacity-95 transition"
              >
                Explore Listings
              </button>
              <button
                onClick={() => navigate('/customer/post-requirement')}
                className="px-5 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-xs font-bold hover:bg-surface-secondary transition flex items-center gap-1.5"
              >
                <FiPlusSquare size={14} />
                <span>Post Requirement</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex flex-col bg-surface/80 ${!selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between glass">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedThreadId(null)}
                  className="md:hidden p-1.5 text-[#1a1a1a] bg-white hover:bg-[#f8f4ec] rounded-md border border-[#e3dccb] flex items-center gap-1 text-xs font-bold shrink-0 cursor-pointer"
                >
                  <FiArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <div className="w-9 h-9 rounded-2xl gradient-brand text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentThread.name ? currentThread.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary font-display flex items-center gap-1.5">
                    <span>{currentThread.name || 'Select Conversation'}</span>
                    {mutedThreads[currentThread.id] && <FiBellOff size={11} className="text-text-tertiary" />}
                    <AdminStatusBadge status="Verified" />
                  </h4>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Live Chat
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-text-tertiary relative" ref={menuRef}>
                <button
                  onClick={() => {
                    setShowChatSearch((prev) => !prev);
                    setChatSearchQuery('');
                  }}
                  title="Search within conversation"
                  className={`p-2 rounded-xl hover:bg-surface-tertiary hover:text-brand-purple transition ${
                    showChatSearch ? 'bg-surface-tertiary text-brand-purple' : ''
                  }`}
                >
                  <FiSearch size={16} />
                </button>
                <button
                  onClick={() => toast.success('Calling feature coming soon')}
                  title="Audio Call"
                  className="p-2 rounded-xl hover:bg-surface-tertiary hover:text-brand-purple transition"
                >
                  <FiPhoneCall size={16} />
                </button>
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  title="More options"
                  className={`p-2 rounded-xl hover:bg-surface-tertiary hover:text-brand-purple transition ${
                    showMenu ? 'bg-surface-tertiary text-brand-purple' : ''
                  }`}
                >
                  <FiMoreVertical size={16} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-11 w-52 bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-xl z-50 py-1.5 text-xs text-text-primary animate-fade-in">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (currentThread.recipientId) {
                          navigate(`/customer/vendor/${currentThread.recipientId}`);
                        } else {
                          toast.error('Vendor profile unavailable');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-brand-purple/10 hover:text-brand-purple transition text-left font-medium"
                    >
                      <FiExternalLink size={14} />
                      <span>View Vendor Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleToggleMute(currentThread.id);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-brand-purple/10 hover:text-brand-purple transition text-left font-medium"
                    >
                      <FiBellOff size={14} className={mutedThreads[currentThread.id] ? 'text-brand-purple' : ''} />
                      <span>{mutedThreads[currentThread.id] ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        toast.info(`Conversation Info: ${currentThread.name || 'Vendor'}`);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-brand-purple/10 hover:text-brand-purple transition text-left font-medium"
                    >
                      <FiInfo size={14} />
                      <span>Chat Details</span>
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleClearChat();
                      }}
                      disabled={isClearing}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-500 transition text-left font-medium disabled:opacity-50"
                    >
                      <FiTrash2 size={14} />
                      <span>Clear Chat History</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeleteChat();
                      }}
                      disabled={isDeletingConvs}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-rose-500/10 text-rose-500 transition text-left font-medium disabled:opacity-50"
                    >
                      <FiTrash2 size={14} />
                      <span>Delete Chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Search Field */}
            {showChatSearch && (
              <div className="px-4 py-2 border-b border-border bg-surface-secondary/20 flex items-center justify-between gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Search inside this chat..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:border-brand-purple font-semibold text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowChatSearch(false);
                    setChatSearchQuery('');
                  }}
                  className="text-text-tertiary hover:text-text-primary text-xs font-semibold px-2"
                >
                  Close
                </button>
              </div>
            )}

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isMsgLoading && filteredMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-tertiary">
                  Loading chat history...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-tertiary">
                  {chatSearchQuery.trim() ? 'No messages match search query.' : 'No messages in this conversation yet. Send a message to start chatting!'}
                </div>
              ) : (
                filteredMessages.map((m) => {
                  const isMine = m.sender === 'customer';
                  return (
                    <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs shadow-sm ${
                          isMine
                            ? 'bg-brand-purple text-white rounded-br-none font-medium'
                            : 'bg-surface-secondary text-text-primary rounded-bl-none border border-border'
                        }`}
                      >
                        {m.media && (
                          <div className="mb-2 max-w-sm overflow-hidden rounded-lg">
                            <img src={m.media} alt="Attachment" className="max-w-full h-auto object-cover max-h-60" />
                          </div>
                        )}
                        <p>{m.text}</p>
                      </div>
                      <span className="text-[9px] text-text-tertiary mt-1 flex items-center gap-1">
                        {m.time} {isMine && <FiCheck size={12} className="text-brand-purple" />}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex items-center gap-2 glass">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl hover:bg-surface-tertiary text-text-tertiary hover:text-brand-purple transition"
                title="Send Image Attachment"
              >
                <FiPaperclip size={16} />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
              />
              <button
                type="submit"
                disabled={isSending || !messageInput.trim()}
                className="px-5 py-2.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend size={14} />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

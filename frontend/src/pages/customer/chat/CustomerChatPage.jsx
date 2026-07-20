import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiMessageSquare, FiBriefcase, FiTool, FiSend, FiUser, FiCheck,
  FiSearch, FiPaperclip, FiPhoneCall, FiMoreVertical, FiClock, FiShield, FiPlusSquare
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
  useSendMessageMutation
} from '../../../features/chat/chatApi';

const TABS = [
  { key: 'vendors', label: 'Vendor Messages', icon: FiBriefcase },
  { key: 'service-providers', label: 'Service Provider Chats', icon: FiTool },
];

export default function CustomerChatPage() {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?._id || currentUser?.id;
  const [activeTab, setActiveTab] = useState('vendors');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // RTK Query hooks with 3s polling for real-time sync
  const { data: convData, isFetching: isConvLoading, refetch: refetchConvs } = useGetConversationsQuery(undefined, { pollingInterval: 3000 });
  const [sendMessageApi, { isLoading: isSending }] = useSendMessageMutation();

  const conversationsList = convData?.data?.conversations || convData?.conversations || convData?.data || (Array.isArray(convData) ? convData : []);

  // Process live database threads
  const liveThreads = conversationsList.map((c) => {
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

  const filteredThreads = liveThreads.filter((t) => {
    const matchesTab = activeTab === 'vendors' ? t.role !== 'service-providers' : t.role === 'service-providers';
    const matchesSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Auto-select first thread if none selected
  useEffect(() => {
    if (!selectedThreadId && filteredThreads.length > 0) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId]);

  const currentThread = filteredThreads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || {};

  // Fetch real message history for selected thread
  const { data: msgData, isFetching: isMsgLoading, refetch: refetchMessages } = useGetMessagesQuery(
    { conversationId: selectedThreadId },
    { skip: !selectedThreadId, pollingInterval: 3000 }
  );

  // Real-time Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (selectedThreadId) {
      socket.emit('join_conversation', selectedThreadId);
      socket.emit('mark_seen', { conversationId: selectedThreadId });
    }

    const handleIncomingMessage = (msg) => {
      const msgConvId = msg.conversationId || msg.conversation || msg.conversation?._id;
      if (msgConvId === selectedThreadId) {
        refetchMessages();
      }
      refetchConvs();
    };

    socket.on('message', handleIncomingMessage);
    socket.on('chat_message', handleIncomingMessage);
    socket.on('message_alert', () => refetchConvs());

    return () => {
      if (selectedThreadId) {
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
      await sendMessageApi({
        recipientId: currentThread.recipientId,
        text,
      }).unwrap();

      const socket = getSocket();
      if (socket && selectedThreadId) {
        socket.emit('send_message', { conversationId: selectedThreadId, text });
      }

      refetchMessages();
      refetchConvs();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send message');
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
      time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    };
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Header Banner */}
      <AdminPageHeader
        icon={FiMessageSquare}
        title="Live Chat & Communications"
        subtitle="Connect in real-time with verified vendors and service providers"
      />

      {/* Tabs */}
      <AdminTabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedThreadId(null);
        }}
      />

      {/* Dual Pane Glass Chat Interface */}
      <div className="glass rounded-3xl border border-white/50 shadow-card flex flex-col md:flex-row h-[600px] overflow-hidden">
        {/* Left Thread Sidebar */}
        <div className="w-full md:w-80 border-r border-border bg-surface-secondary/40 flex flex-col">
          {/* Search Box */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-text-tertiary w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-purple"
              />
            </div>
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
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThreadId(t.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all duration-200 flex items-center gap-3 border ${
                      isSelected
                        ? 'bg-brand-purple text-white shadow-premium border-transparent'
                        : 'border-transparent text-text-secondary hover:bg-brand-purple/5 hover:text-text-primary'
                    }`}
                  >
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
                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                          {t.name}
                        </h4>
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-tertiary'}`}>
                          {t.time}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-text-tertiary'}`}>
                        {t.lastMessage}
                      </p>
                    </div>
                    {t.unread > 0 && (
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
          <div className="flex-1 flex flex-col bg-surface/80">
            {/* Active Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between glass">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl gradient-brand text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentThread.name ? currentThread.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary font-display flex items-center gap-1.5">
                    <span>{currentThread.name || 'Select Conversation'}</span>
                    <AdminStatusBadge status="Verified" />
                  </h4>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Live Chat
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-text-tertiary">
                <button
                  onClick={() => toast.success('Calling feature coming soon')}
                  className="p-2 rounded-xl hover:bg-surface-tertiary hover:text-brand-purple transition"
                >
                  <FiPhoneCall size={16} />
                </button>
                <button
                  onClick={() => toast.success('More options')}
                  className="p-2 rounded-xl hover:bg-surface-tertiary hover:text-brand-purple transition"
                >
                  <FiMoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isMsgLoading && activeMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-tertiary">
                  Loading chat history...
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-tertiary">
                  No messages in this conversation yet. Send a message to start chatting!
                </div>
              ) : (
                activeMessages.map((m) => {
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
              <button
                type="button"
                onClick={() => toast.info('Attachments supported in direct upload')}
                className="p-2.5 rounded-xl hover:bg-surface-tertiary text-text-tertiary hover:text-brand-purple transition"
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

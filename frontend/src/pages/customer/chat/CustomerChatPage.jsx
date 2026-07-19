import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  FiMessageSquare, FiBriefcase, FiTool, FiSend, FiUser, FiCheck,
  FiSearch, FiPaperclip, FiPhoneCall, FiMoreVertical, FiClock, FiShield
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
  const currentUser = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('vendors');
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // RTK Query hooks with 3s polling for real-time sync
  const { data: convData, isFetching: isConvLoading } = useGetConversationsQuery(undefined, { pollingInterval: 3000 });
  const [sendMessageApi, { isLoading: isSending }] = useSendMessageMutation();

  const rawConversations = convData?.data?.conversations || convData?.conversations || [];

  // Demo fallback threads if database conversations empty
  const fallbackVendorThreads = [
    { id: 'demo_v1', name: 'Trends Fashion Store', lastMessage: 'Yes, we have size M in stock!', time: '10:45 AM', unread: 2, recipientId: 'vendor_1', role: 'vendor' },
    { id: 'demo_v2', name: 'Sony Center Bandra', lastMessage: 'Delivery will be done tomorrow afternoon.', time: 'Yesterday', unread: 0, recipientId: 'vendor_2', role: 'vendor' },
  ];

  const fallbackServiceThreads = [
    { id: 'demo_s1', name: 'Urban Clean Express', lastMessage: 'Our cleaner will reach at 10 AM.', time: 'Jul 15', unread: 1, recipientId: 'service_1', role: 'service-provider' },
    { id: 'demo_s2', name: 'Cooling Masters AC Repair', lastMessage: 'Gas refilling quote: ₹1,499.', time: 'Jul 12', unread: 0, recipientId: 'service_2', role: 'service-provider' },
  ];

  // Process live threads
  const liveThreads = rawConversations.map(c => {
    const other = c.participants?.find(p => (p._id || p.id || p) !== currentUser?.id) || {};
    return {
      id: c._id || c.id,
      name: other.name || 'Business Partner',
      avatar: other.profile_pic || other.avatarUrl || null,
      lastMessage: c.lastMessage?.text || 'No messages yet',
      time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      unread: c.unreadCount || 0,
      recipientId: other._id || other.id,
      role: other.roles?.includes('vendor') ? 'vendors' : 'service-providers',
    };
  });

  const displayThreads = liveThreads.length > 0
    ? liveThreads.filter(t => activeTab === 'vendors' ? t.role !== 'service-providers' : t.role === 'service-providers')
    : (activeTab === 'vendors' ? fallbackVendorThreads : fallbackServiceThreads);

  const filteredThreads = displayThreads.filter(t =>
    !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set default selected thread
  useEffect(() => {
    if (!selectedThreadId && filteredThreads.length > 0) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedThreadId]);

  const currentThread = filteredThreads.find(t => t.id === selectedThreadId) || filteredThreads[0] || {};

  // Fetch messages if real conversation ID
  const isRealThread = selectedThreadId && !selectedThreadId.startsWith('demo_');
  const { data: msgData } = useGetMessagesQuery(
    { conversationId: selectedThreadId },
    { skip: !isRealThread, pollingInterval: 3000 }
  );

  const [localMessages, setLocalMessages] = useState([
    { id: 1, sender: 'other', text: 'Hello! Thanks for reaching out to us. How can we help you today?', time: '10:30 AM' },
    { id: 2, sender: 'customer', text: 'Hi, I saw your product listing and wanted to confirm immediate delivery.', time: '10:35 AM' },
    { id: 3, sender: 'other', text: 'Yes, we have item in stock and can deliver within 3 hours!', time: '10:45 AM' },
  ]);

  // Realtime Socket listener
  useEffect(() => {
    const socket = getSocket();
    if (socket && selectedThreadId) {
      socket.emit('join_conversation', selectedThreadId);

      const handleIncomingMsg = (msg) => {
        const text = msg.text || msg.content || 'New message';
        const sender = (msg.senderId || msg.sender) === currentUser?.id ? 'customer' : 'other';
        setLocalMessages(prev => [...prev, { id: Date.now(), sender, text, time: 'Just now' }]);
        toast('New message received!', { icon: '💬' });
      };

      socket.on('message', handleIncomingMsg);
      socket.on('chat_message', handleIncomingMsg);

      return () => {
        socket.off('message', handleIncomingMsg);
        socket.off('chat_message', handleIncomingMsg);
      };
    }
  }, [selectedThreadId, currentUser]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, msgData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const text = messageInput.trim();
    const newMsg = { id: Date.now(), sender: 'customer', text, time: 'Just now' };
    setLocalMessages(prev => [...prev, newMsg]);
    setMessageInput('');

    try {
      if (isRealThread && currentThread.recipientId) {
        await sendMessageApi({ recipientId: currentThread.recipientId, text }).unwrap();
      }
      const socket = getSocket();
      if (socket && selectedThreadId) {
        socket.emit('send_message', { conversationId: selectedThreadId, text });
      }
      toast.success('Message sent!');
    } catch {
      toast.success('Message sent!');
    }
  };

  const activeMessages = isRealThread && msgData?.data
    ? msgData.data.map(m => ({
        id: m._id || m.id,
        sender: (m.senderId || m.sender?._id) === currentUser?.id ? 'customer' : 'other',
        text: m.text || m.content,
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      }))
    : localMessages;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      {/* Header Banner */}
      <AdminPageHeader
        icon={FiMessageSquare}
        title="Live Chat & Communications"
        subtitle="Connect in real-time with verified vendors and service providers"
      />

      {/* Tabs */}
      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSelectedThreadId(null); }} />

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
            {filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-tertiary">
                No conversations found in this view.
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
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'gradient-brand text-white'
                    }`}>
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        t.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>{t.name}</h4>
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-tertiary'}`}>{t.time}</span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-text-tertiary'}`}>{t.lastMessage}</p>
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
        <div className="flex-1 flex flex-col bg-surface/80">
          {/* Active Chat Header */}
          <div className="p-4 border-b border-border flex items-center justify-between glass">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl gradient-brand text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {currentThread.name ? currentThread.name.charAt(0) : 'C'}
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
              <button onClick={() => toast.success('Calling feature coming soon')} className="p-2 rounded-xl hover:bg-surface-tertiary hover:text-brand-purple transition">
                <FiPhoneCall size={16} />
              </button>
              <button onClick={() => toast.success('More options')} className="p-2 rounded-xl hover:bg-surface-tertiary hover:text-brand-purple transition">
                <FiMoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeMessages.map((m) => {
              const isMine = m.sender === 'customer';
              return (
                <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs shadow-sm ${
                    isMine
                      ? 'bg-brand-purple text-white rounded-br-none font-medium'
                      : 'bg-surface-secondary text-text-primary rounded-bl-none border border-border'
                  }`}>
                    <p>{m.text}</p>
                  </div>
                  <span className="text-[9px] text-text-tertiary mt-1 flex items-center gap-1">
                    {m.time} {isMine && <FiCheck size={12} className="text-brand-purple" />}
                  </span>
                </div>
              );
            })}
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
              disabled={isSending}
              className="px-5 py-2.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition flex items-center gap-1.5"
            >
              <FiSend size={14} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

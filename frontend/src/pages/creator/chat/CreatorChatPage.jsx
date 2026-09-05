import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  FiMessageSquare, FiUser, FiSend, FiCheck,
  FiSearch, FiPaperclip, FiMoreVertical, FiShield, FiBriefcase, FiTrash2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useClearChatMutation,
  useDeleteConversationMutation
} from '../../../features/chat/chatApi';
import { getSocket } from '../../../lib/socket';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorChatPage() {
  const { bi } = useLanguage();
  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?._id || currentUser?.id;
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('userId');
  const queryName = searchParams.get('name');

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // RTK Query hooks scoped strictly to CREATOR role
  const { data: convData, isFetching: isConvLoading, refetch: refetchConvs } = useGetConversationsQuery('creator', {
    pollingInterval: 300000,
    refetchOnMountOrArgChange: true,
  });
  const [sendMessageApi, { isLoading: isSending }] = useSendMessageMutation();
  const [clearChatApi] = useClearChatMutation();
  const [deleteConversationApi] = useDeleteConversationMutation();

  const conversationsList = convData?.data?.conversations || convData?.conversations || convData?.data || (Array.isArray(convData) ? convData : []);

  // Process creator threads
  const liveThreads = conversationsList.map((c) => {
    const participants = c.participants || [];
    const other = participants.find((p) => (p._id || p.id || p) !== currentUserId) || {};
    const recipientId = other._id || other.id || (typeof other === 'string' ? other : null);
    const name = other.name || other.shopName || other.businessName || 'Brand / Client';
    const avatar = other.avatarUrl || other.profile_pic || null;

    return {
      id: c._id || c.id,
      name,
      avatar,
      lastMessage: c.lastMessage?.text || c.lastMessage?.content || 'No messages yet',
      time: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
      unread: c.unreadCount?.[currentUserId] || 0,
      recipientId,
      rawConversation: c,
    };
  });

  // Handle URL pre-select or query params
  useEffect(() => {
    if (queryUserId && liveThreads.length > 0 && !selectedThreadId) {
      const match = liveThreads.find(t => t.recipientId === queryUserId);
      if (match) setSelectedThreadId(match.id);
    } else if (!selectedThreadId && liveThreads.length > 0) {
      setSelectedThreadId(liveThreads[0].id);
    }
  }, [queryUserId, liveThreads, selectedThreadId]);

  const filteredThreads = liveThreads.filter((t) => {
    return !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const currentThread = filteredThreads.find((t) => t.id === selectedThreadId) || filteredThreads[0] || {};

  // Fetch message history for selected thread
  const { data: msgData, isFetching: isMsgLoading, refetch: refetchMessages } = useGetMessagesQuery(
    { conversationId: selectedThreadId },
    { skip: !selectedThreadId, pollingInterval: 300000, refetchOnMountOrArgChange: true }
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
    if (!messageInput.trim() || (!currentThread.recipientId && !queryUserId)) {
      toast.error(bi('Cannot find recipient for this conversation', 'इस बातचीत के लिए प्राप्तकर्ता नहीं मिला'));
      return;
    }

    const targetRecipientId = currentThread.recipientId || queryUserId;
    const text = messageInput.trim();
    setMessageInput('');

    try {
      const res = await sendMessageApi({
        recipientId: targetRecipientId,
        text,
        roleContext: 'creator',
      }).unwrap();

      const socket = getSocket();
      if (socket && selectedThreadId) {
        socket.emit('send_message', { conversationId: selectedThreadId, text });
      }

      refetchMessages();
      refetchConvs();
    } catch (err) {
      toast.error(err?.data?.message || bi('Failed to send message', 'संदेश भेजना विफल रहा'));
    }
  };

  const rawMessagesList = msgData?.data?.messages || msgData?.data || (Array.isArray(msgData) ? msgData : []);

  const activeMessages = rawMessagesList.map((m) => {
    const senderId = m.senderId || m.sender?._id || m.sender;
    const isMine = String(senderId) === String(currentUserId);

    return {
      id: m._id || m.id,
      sender: isMine ? 'creator' : 'other',
      text: m.text || m.content || '',
      time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5 font-sans p-2 sm:p-4 min-h-screen pb-16">
      {/* Header Banner matching Creator Studio Theme */}
      <div className="bg-[#241b15] text-white p-5 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            CREATOR STUDIO CHAT INBOX
          </span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white flex items-center gap-2">
            <FiMessageSquare className="text-[#d99a3d]" />
            <span>{bi('CREATOR CAMPAIGN CHATS', 'क्रिएटर अभियान चैट')}</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {bi('Direct inbox for brand deal inquiries, reel sponsorship briefs, and vendor campaign collaborations.', 'ब्रांड डील पूछताछ, रील्स प्रायोजन ब्रीफ और विक्रेता अभियान सहयोग के लिए सीधा इनबॉक्स।')}
          </p>
        </div>

        <div className="px-3.5 py-2 bg-[#d99a3d]/20 border border-[#d99a3d] rounded text-xs font-black text-[#d99a3d] uppercase tracking-wider flex items-center gap-2 shrink-0">
          <FiBriefcase size={15} />
          <span>{bi('Creator Workspace Active', 'क्रिएटर कार्यस्थान सक्रिय')}</span>
        </div>
      </div>

      {/* Dual-Pane Chat Layout */}
      <div className="bg-white rounded-md border-2 border-[#e3dccb] shadow-xs flex flex-col md:flex-row h-[620px] overflow-hidden">
        {/* Left Threads Sidebar */}
        <div className="w-full md:w-80 border-r-2 border-[#e3dccb] bg-[#f8f4ec] flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-[#e3dccb] bg-white">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={bi('Search brand clients...', 'ब्रांड क्लाइंट खोजें...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-md text-xs font-bold text-[#241b15] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isConvLoading && filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs font-bold text-slate-500">
                {bi('Loading campaign threads...', 'अभियान थ्रेड लोड हो रहे हैं...')}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                <p className="font-black text-[#241b15] uppercase tracking-wider">{bi('No Creator Chats Found', 'कोई क्रिएटर चैट नहीं मिली')}</p>
                <p className="text-[11px] font-medium">{bi('Brands or Vendors who hire you will appear here.', 'ब्रांड्स या विक्रेता जो आपको काम पर रखते हैं वे यहाँ दिखाई देंगे।')}</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = selectedThreadId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedThreadId(t.id)}
                    className={`w-full p-3 rounded-md text-left transition-all flex items-center gap-3 border cursor-pointer ${
                      isSelected
                        ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                        : 'bg-white border-[#e3dccb] text-slate-700 hover:bg-[#f8f4ec] hover:text-[#241b15]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#241b15] flex items-center justify-center font-black text-xs shrink-0 border border-[#241b15]">
                      {t.avatar ? (
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        t.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-[#241b15]'}`}>
                          {t.name}
                        </h4>
                        <span className={`text-[10px] font-bold ${isSelected ? 'text-[#d99a3d]' : 'text-slate-500'}`}>
                          {t.time}
                        </span>
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 font-medium ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                        {t.lastMessage}
                      </p>
                    </div>
                    {t.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#d99a3d] text-[#241b15] text-[10px] font-black flex items-center justify-center shrink-0">
                        {t.unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Window */}
        {filteredThreads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8f4ec] gap-3">
            <div className="w-12 h-12 rounded-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black">
              <FiMessageSquare size={24} />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-sm font-black uppercase text-[#241b15] tracking-wider">{bi('No Selected Conversation', 'कोई चुनी हुई बातचीत नहीं')}</h3>
              <p className="text-xs text-slate-600 font-medium">
                {bi('Select a conversation from the left thread panel to view brief messages and discuss reel pricing.', 'संक्षिप्त संदेश देखने और रील मूल्य निर्धारण पर चर्चा करने के लिए बाएं पैनल से एक बातचीत चुनें।')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white">
            {/* Active Thread Header */}
            <div className="p-4 border-b-2 border-[#e3dccb] flex items-center justify-between bg-[#f8f4ec]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs border border-[#241b15]">
                  {currentThread.name ? currentThread.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#241b15] uppercase tracking-wider flex items-center gap-2">
                    <span>{currentThread.name || 'Brand Client'}</span>
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    {bi('Active Creator Client Thread', 'सक्रिय क्रिएटर क्लाइंट थ्रेड')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Clear messages in this conversation thread?')) {
                      try {
                        await clearChatApi(selectedThreadId).unwrap();
                        refetchMessages();
                        toast.success('Chat messages cleared');
                      } catch (err) {
                        toast.error('Failed to clear messages');
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-white border border-[#e3dccb] hover:bg-[#e3dccb] text-[#241b15] rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <FiTrash2 size={13} />
                  <span>{bi('Clear', 'साफ़ करें')}</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f4ec]/40">
              {isMsgLoading && activeMessages.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500">
                  {bi('Loading history messages...', 'संदेश लोड हो रहे हैं...')}
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  {bi('No messages in this campaign thread yet. Send a response to begin!', 'इस अभियान थ्रेड में अभी तक कोई संदेश नहीं है। शुरू करने के लिए उत्तर भेजें!')}
                </div>
              ) : (
                activeMessages.map((m) => {
                  const isMine = m.sender === 'creator';
                  return (
                    <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-xs sm:max-w-md p-3 rounded-md text-xs font-bold leading-relaxed shadow-2xs ${
                          isMine
                            ? 'bg-[#241b15] text-[#d99a3d] border border-[#241b15] rounded-br-none'
                            : 'bg-white text-[#241b15] border-2 border-[#e3dccb] rounded-bl-none'
                        }`}
                      >
                        <p>{m.text}</p>
                      </div>
                      <span className="text-[9.5px] font-mono font-bold text-slate-500 mt-1 flex items-center gap-1">
                        {m.time} {isMine && <FiCheck size={12} className="text-[#d99a3d]" />}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-[#e3dccb] flex items-center gap-2 bg-white">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={bi('Type message to client...', 'क्लाइंट को संदेश लिखें...')}
                className="flex-1 px-4 py-2.5 bg-[#f8f4ec] border-2 border-[#e3dccb] focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] rounded-md text-xs font-bold text-[#241b15] outline-hidden"
              />
              <button
                type="submit"
                disabled={isSending || !messageInput.trim()}
                className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#342820] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FiSend size={14} />
                <span>{bi('Send', 'भेजें')}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

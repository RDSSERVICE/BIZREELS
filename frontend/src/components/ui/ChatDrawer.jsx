import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FiSend, FiX, FiMessageSquare, FiTag, FiClock, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../../lib/socket';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} from '../../features/chat/chatApi';
import Loader from '../common/Loader';

/**
 * ChatDrawer Component — Warm Editorial Bento Redesign
 * In-context side drawer for chatting with vendor/creator directly from Reels or Listings.
 */
export default function ChatDrawer({
  isOpen,
  onClose,
  recipientId,
  recipientName = 'Vendor Partner',
  recipientAvatar = null,
  listingInfo = null, // Optional context info { title, image, price }
}) {
  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?._id || currentUser?.id;
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch active conversations list to resolve threadId
  const { data: convData, refetch: refetchConvs } = useGetConversationsQuery(undefined, { skip: !isOpen });
  const conversationsList = convData?.data?.conversations || convData?.conversations || convData?.data || [];

  // Find if there is an existing conversation
  const existingConv = conversationsList.find((c) =>
    c.participants?.some((p) => (p._id || p.id || p).toString() === recipientId?.toString())
  );

  const conversationId = existingConv ? (existingConv._id || existingConv.id) : `temp-${recipientId}`;

  // Fetch messages history
  const { data: msgData, isLoading: isMsgLoading, refetch: refetchMessages } = useGetMessagesQuery(
    { conversationId },
    {
      skip: !isOpen || !conversationId || String(conversationId).startsWith('temp-'),
      pollingInterval: 120000,
    }
  );

  const [sendMessageApi, { isLoading: isSending }] = useSendMessageMutation();
  const messagesList = msgData?.data?.messages || msgData?.messages || msgData?.data || [];

  // Socket IO Sync
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isOpen || !conversationId) return;

    const isTemp = String(conversationId).startsWith('temp-');

    if (!isTemp) {
      socket.emit('join_conversation', conversationId);
      socket.emit('mark_seen', { conversationId });
    }

    const handleIncomingMessage = (msg) => {
      const msgConvId = msg.conversationId || msg.conversation || msg.conversation?._id;
      if (msgConvId === conversationId) {
        if (typeof refetchMessages === 'function') refetchMessages();
      }
      if (typeof refetchConvs === 'function') refetchConvs();
    };

    socket.on('message', handleIncomingMessage);
    socket.on('chat_message', handleIncomingMessage);

    return () => {
      if (!isTemp) {
        socket.emit('leave_conversation', conversationId);
      }
      socket.off('message', handleIncomingMessage);
      socket.off('chat_message', handleIncomingMessage);
    };
  }, [isOpen, conversationId, refetchMessages, refetchConvs]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesList, isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !recipientId) return;

    const text = messageInput.trim();
    setMessageInput('');

    try {
      const res = await sendMessageApi({
        recipientId,
        text,
      }).unwrap();

      const socket = getSocket();
      const newConversationId = res.data?.message?.conversationId || res.data?.message?.conversation || res.message?.conversationId || res.message?.conversation;

      if (socket && newConversationId) {
        socket.emit('send_message', { conversationId: newConversationId, text });
      }

      if (typeof refetchConvs === 'function') refetchConvs();
      if (typeof refetchMessages === 'function') refetchMessages();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleQuickPrompt = (promptText) => {
    setMessageInput(promptText);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="relative z-10 w-full max-w-md h-full bg-[#f8f4ec] shadow-2xl border-l border-[#e3dccb] flex flex-col font-sans"
        >
          {/* ── HEADER ── */}
          <div className="px-4 sm:px-5 py-3.5 bg-[#241b15] text-white border-b border-[#3a2c22] flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {recipientAvatar ? (
                  <img
                    src={recipientAvatar}
                    alt={recipientName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#d99a3d] bg-[#3a2c22]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-[#d99a3d] bg-[#3a2c22] text-[#d99a3d] flex items-center justify-center font-black text-sm uppercase">
                    {(recipientName || 'V').charAt(0)}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#241b15] rounded-full" />
              </div>
              <div className="min-w-0">
                <h4 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm font-black text-white uppercase tracking-tight truncate">
                  {recipientName}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold text-[#d99a3d] bg-[#3a2c22] px-2 py-0.5 rounded-full border border-[#d99a3d]/30 uppercase tracking-wide">
                    Live Vendor Chat
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#3a2c22] hover:bg-[#d99a3d] text-white hover:text-[#1a1a1a] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close Chat"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* ── OPTIONAL REEL / LISTING CONTEXT BAR ── */}
          {listingInfo && (
            <div className="bg-[#ede6d8] border-b border-[#e3dccb] px-4 py-2.5 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {listingInfo.image && (
                  <img src={listingInfo.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#e3dccb] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold text-[#241b15] truncate">{listingInfo.title || 'Marketplace Item'}</p>
                  <span className="text-[10px] font-bold text-[#d99a3d]">Inquiring from Reel</span>
                </div>
              </div>
              {listingInfo.price && (
                <span className="text-xs font-black text-[#241b15] shrink-0">₹{listingInfo.price}</span>
              )}
            </div>
          )}

          {/* ── MESSAGES LIST ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#f2ede4]">
            {isMsgLoading && !String(conversationId).startsWith('temp-') ? (
              <div className="py-20 flex justify-center">
                <Loader size="sm" />
              </div>
            ) : String(conversationId).startsWith('temp-') && messagesList.length === 0 ? (
              /* EMPTY STATE — BENTO STYLING */
              <div className="py-8 space-y-4">
                <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl p-6 shadow-xs text-center max-w-sm mx-auto space-y-3">
                  <div className="w-13 h-13 bg-[#241b15] text-[#d99a3d] rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <FiMessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm font-black text-[#241b15] uppercase tracking-wide">
                      Direct Context Chat
                    </h3>
                    <p className="text-[11.5px] font-medium text-[#6a6256] mt-1 leading-relaxed">
                      Ask <span className="font-extrabold text-[#241b15]">{recipientName}</span> about product pricing, availability, or custom requests.
                    </p>
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <p className="text-[10px] font-extrabold uppercase text-[#8a8072] tracking-wider text-center">Quick Questions</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      '💬 Is this available?',
                      '💰 What is the best price?',
                      '📍 Do you deliver nearby?',
                      '📞 Can we connect on call?'
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white border border-[#e3dccb] hover:border-[#241b15] hover:bg-[#241b15] text-[#241b15] hover:text-[#d99a3d] transition-all cursor-pointer shadow-2xs"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : messagesList.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs font-bold text-[#8a8072]">No messages yet. Send a greeting to start chatting.</p>
              </div>
            ) : (
              messagesList.map((msg) => {
                const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
                const isMe = senderId?.toString() === currentUserId?.toString();

                return (
                  <div key={msg._id || msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                        isMe
                          ? 'bg-[#241b15] text-[#f8f4ec] border border-[#3a2c22] rounded-tr-none'
                          : 'bg-white border border-[#e3dccb] text-[#1a1a1a] rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text || msg.content}</p>
                      <span
                        className={`text-[9px] mt-1 block text-right font-semibold ${
                          isMe ? 'text-[#d99a3d]' : 'text-[#8a8276]'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── BOTTOM FORM DOCK ── */}
          <form onSubmit={handleSend} className="p-3.5 border-t border-[#e3dccb] bg-[#f8f4ec] flex gap-2 items-center shrink-0">
            <input
              type="text"
              placeholder={`Send message to ${recipientName}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-4 py-3 text-xs font-semibold bg-white border border-[#e3dccb] focus:border-[#d99a3d] focus:outline-none text-[#1a1a1a] rounded-xl shadow-2xs placeholder-[#8a8072]"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || isSending}
              className="w-11 h-11 rounded-xl bg-[#d99a3d] hover:bg-[#c8872b] disabled:opacity-50 text-[#1a1a1a] font-extrabold flex items-center justify-center shadow-md transition-all cursor-pointer border-none shrink-0"
              title="Send Message"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FiSend, FiX, FiMessageSquare, FiInfo } from 'react-icons/fi';
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
import Button from '../common/Button';

/**
 * ChatDrawer Component
 * An in-context side drawer that allows customers to chat with vendor owners directly from feed items.
 */
export default function ChatDrawer({
  isOpen,
  onClose,
  recipientId,
  recipientName = 'Vendor Partner',
  recipientAvatar = null,
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
    e.preventDefault();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Dark blur backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-brand-navy-dark/40 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Sidebar Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative z-10 w-full max-w-md h-full bg-surface shadow-2xl border-l border-border flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-secondary">
            <div className="flex items-center gap-3">
              <img
                src={recipientAvatar || 'https://via.placeholder.com/150'}
                alt={recipientName}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
              <div>
                <h4 className="text-sm font-bold text-text-primary font-display">{recipientName}</h4>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Online Chat
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-tertiary rounded-full transition text-text-secondary"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-tertiary/20">
            {isMsgLoading && !String(conversationId).startsWith('temp-') ? (
              <div className="py-20 flex justify-center">
                <Loader size="sm" />
              </div>
            ) : String(conversationId).startsWith('temp-') && messagesList.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <FiMessageSquare className="w-12 h-12 text-brand-purple mx-auto opacity-50" />
                <p className="text-xs font-bold text-text-primary">Direct Context Chat</p>
                <p className="text-[11px] text-text-tertiary max-w-xs mx-auto">
                  Type your first message to start discussing this listing with {recipientName}.
                </p>
              </div>
            ) : messagesList.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[11px] text-text-tertiary">No messages yet. Send a greeting to start chatting.</p>
              </div>
            ) : (
              messagesList.map((msg) => {
                const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
                const isMe = senderId?.toString() === currentUserId?.toString();

                return (
                  <div key={msg._id || msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                        isMe
                          ? 'bg-brand-purple text-white rounded-tr-none'
                          : 'bg-surface border border-border text-text-primary rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text || msg.content}</p>
                      <span
                        className={`text-[8px] mt-1 block text-right ${
                          isMe ? 'text-white/60' : 'text-text-tertiary'
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

          {/* Form Send Dock */}
          <form onSubmit={handleSend} className="p-4 border-t border-border bg-surface-secondary flex gap-2 items-center">
            <input
              type="text"
              placeholder={`Send message to ${recipientName}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:border-brand-purple text-text-primary"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSending}
              disabled={!messageInput.trim()}
              className="rounded-xl !p-2.5 aspect-square"
            >
              <FiSend className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

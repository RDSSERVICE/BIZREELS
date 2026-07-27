import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiPaperclip, FiCamera, FiAlertCircle } from 'react-icons/fi';
import { api } from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';
import toast from 'react-hot-toast';

export default function DirectChatContainer({ recipientId, creatorName, creatorAvatar }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (recipientId) {
      loadChat();
    }
  }, [recipientId]);

  // Real-time socket event listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (msg) => {
      // If message belongs to this thread and we don't already have it
      if (msg.conversation?.toString() === conversationId.toString() || msg.conversation === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => (m._id || m.id) === (msg._id || msg.id))) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    };

    socket.on('message', handleNewMessage);
    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('message', handleNewMessage);
    };
  }, [conversationId]);

  const loadChat = async () => {
    setLoading(true);
    try {
      // Find or create conversation by sending an empty/placeholder message or fetching conversations
      const convRes = await api.get('/v1/chat/conversations');
      const list = convRes.data?.conversations || [];
      
      // Look for conversation where participants include recipientId
      let thread = list.find((c) =>
        c.participants.some((p) => String(p._id || p.id || p) === String(recipientId))
      );

      if (thread) {
        const threadId = thread._id || thread.id;
        setConversationId(threadId);
        
        // Fetch message history
        const msgRes = await api.get(`/v1/chat/${threadId}/messages`);
        const listMsgs = Array.isArray(msgRes.data) ? msgRes.data : msgRes.data?.messages || [];
        setMessages(listMsgs);
      } else {
        // No thread, we will create one upon sending first message
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setMessages([]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl.trim()) return;

    try {
      const payload = {
        recipientId,
        text: text.trim() || null,
        media: mediaUrl.trim()
          ? { url: mediaUrl.trim(), type: mediaType }
          : null,
      };

      const res = await api.post('/v1/chat/messages', payload);
      const newMsg = res.data?.message;
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
        setText('');
        setMediaUrl('');
        scrollToBottom();

        // If conversation ID is not established, reload to join room
        if (!conversationId && newMsg.conversation) {
          setConversationId(newMsg.conversation);
        }
      }
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  const handleUploadLink = () => {
    const url = prompt('Enter the link to the image/file/attachment:');
    if (url && url.startsWith('http')) {
      setMediaUrl(url);
      setMediaType(url.match(/\.(jpeg|jpg|gif|png)$/i) ? 'image' : 'file');
      toast.success('Link attached! Hit send to deliver.');
    }
  };

  return (
    <div className="glass rounded-3xl border border-white/40 shadow-card flex flex-col h-[500px] overflow-hidden">
      {/* Chat header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3 bg-surface-secondary/20 shrink-0">
        <img
          src={creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
          alt={creatorName}
          className="w-9 h-9 rounded-full object-cover border border-border"
        />
        <div>
          <h4 className="font-bold text-xs text-text-primary">{creatorName || 'Creator Client'}</h4>
          <span className="text-[10px] text-emerald-500 font-bold">Active Collaboration Chat</span>
        </div>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-surface-secondary/5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-tertiary text-xs">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-purple" />
            <span>Syncing history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-text-tertiary text-xs text-center p-6">
            <FiAlertCircle size={24} />
            <p className="font-bold text-text-secondary">Start the conversation</p>
            <p>Send a message to coordinate storyboard briefs and reviews deadlines.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = String(msg.sender?._id || msg.sender?.id || msg.sender) !== String(recipientId);
            
            return (
              <div
                key={msg._id || i}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-3 text-xs ${
                    isMe
                      ? 'bg-brand-purple text-white rounded-tr-none'
                      : 'bg-surface border border-border text-text-primary rounded-tl-none'
                  }`}
                >
                  {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                  
                  {msg.media?.url && (
                    <div className="mt-1">
                      {msg.media.type === 'image' ? (
                        <a href={msg.media.url} target="_blank" rel="noreferrer">
                          <img
                            src={msg.media.url}
                            alt="Attachment"
                            className="max-h-40 rounded-lg object-cover max-w-full hover:scale-105 transition"
                          />
                        </a>
                      ) : (
                        <a
                          href={msg.media.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-bold text-[10px] flex items-center gap-1"
                        >
                          📎 View File Attachment
                        </a>
                      )}
                    </div>
                  )}

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

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border/50 bg-surface shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={handleUploadLink}
          className="p-2 bg-surface-secondary border border-border rounded-xl text-text-secondary hover:text-brand-purple transition"
          title="Add image/file link"
        >
          <FiPaperclip size={16} />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mediaUrl ? 'Attachment attached. Type a comment...' : 'Type your message...'}
          className="flex-1 bg-surface-secondary border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-purple"
        />

        <button
          type="submit"
          disabled={!text.trim() && !mediaUrl.trim()}
          className="p-2 gradient-brand text-white rounded-xl shadow-premium hover:opacity-95 transition disabled:opacity-50 disabled:shadow-none"
        >
          <FiSend size={16} />
        </button>
      </form>
    </div>
  );
}

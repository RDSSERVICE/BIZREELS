import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiBriefcase, FiTool, FiSend, FiUser, FiCheck } from 'react-icons/fi';
import { getSocket } from '../../../lib/socket';
import toast from 'react-hot-toast';

export default function CustomerChatPage() {
  const [chatType, setChatType] = useState('vendors'); // 'vendors' | 'service-providers'
  const [selectedThread, setSelectedThread] = useState('t1');
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('join_conversation', selectedThread);
      const handleIncomingMsg = (msgData) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: msgData.senderId === 'me' ? 'customer' : 'vendor',
            text: msgData.text || msgData.content || 'New message',
            time: 'Just now'
          }
        ]);
        toast('New message received!', { icon: '💬' });
      };

      socket.on('chat_message', handleIncomingMsg);
      socket.on('message', handleIncomingMsg);

      return () => {
        socket.off('chat_message', handleIncomingMsg);
        socket.off('message', handleIncomingMsg);
      };
    }
  }, [selectedThread]);

  const vendorThreads = [
    { id: 't1', name: 'Trends Fashion Store', lastMessage: 'Yes, we have size M in stock!', time: '10:45 AM', unread: 2 },
    { id: 't2', name: 'Sony Center Bandra', lastMessage: 'Delivery will be done tomorrow afternoon.', time: 'Yesterday', unread: 0 }
  ];

  const serviceThreads = [
    { id: 't3', name: 'Urban Clean Express', lastMessage: 'Our cleaner will reach at 10 AM.', time: 'Jul 15', unread: 1 },
    { id: 't4', name: 'Cooling Masters AC Repair', lastMessage: 'Gas refilling quote: ₹1,499.', time: 'Jul 12', unread: 0 }
  ];

  const [messages, setMessages] = useState([
    { id: 1, sender: 'vendor', text: 'Hello! Thanks for reaching out. How can I help you?', time: '10:30 AM' },
    { id: 2, sender: 'customer', text: 'Hi, is the Sony 55 OLED TV available for instant delivery in Bandra?', time: '10:35 AM' },
    { id: 3, sender: 'vendor', text: 'Yes, we have size M and 55 inch OLED in stock! We can deliver within 3 hours.', time: '10:45 AM' }
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = { id: Date.now(), sender: 'customer', text: messageInput, time: 'Just now' };
    setMessages((prev) => [...prev, newMsg]);

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', { conversationId: selectedThread, text: messageInput });
    }

    setMessageInput('');
    toast.success('Message sent!');
  };

  const activeThreads = chatType === 'vendors' ? vendorThreads : serviceThreads;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-130px)] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FiMessageSquare className="text-indigo-400" />
          <span>Customer Live Chat</span>
        </h2>

        {/* Chat Category Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => { setChatType('vendors'); setSelectedThread('t1'); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold transition ${
              chatType === 'vendors' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FiBriefcase size={14} />
            <span>Vendors Chat</span>
          </button>

          <button
            onClick={() => { setChatType('service-providers'); setSelectedThread('t3'); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold transition ${
              chatType === 'service-providers' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FiTool size={14} />
            <span>Service Provider Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread List Sidebar */}
        <div className="w-full sm:w-72 border-r border-slate-800 bg-slate-950/60 overflow-y-auto p-3 space-y-2">
          {activeThreads.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedThread(t.id)}
              className={`w-full p-3 rounded-2xl text-left transition flex items-center gap-3 border ${
                selectedThread === t.id
                  ? 'bg-slate-800 border-indigo-500/40 text-white'
                  : 'border-transparent text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">{t.name}</h4>
                  <span className="text-[10px] text-slate-500">{t.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Conversation Viewport */}
        <div className="flex-1 flex flex-col bg-slate-950/90">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                V
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Active Conversation</h4>
                <p className="text-[10px] text-emerald-400 font-semibold">Online now</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'customer' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-xs sm:max-w-md p-3 rounded-2xl text-xs ${
                    m.sender === 'customer'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                  {m.time} {m.sender === 'customer' && <FiCheck size={12} className="text-indigo-400" />}
                </span>
              </div>
            ))}
          </div>

          {/* Send Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2 bg-slate-900">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message to vendor..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
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

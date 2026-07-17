import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiVideo,
  FiUser,
  FiHeart,
  FiX,
  FiMessageSquare,
  FiSend,
  FiTv,
  FiActivity,
  FiWifi
} from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectAccessToken } from '../features/auth/authSlice';
import { io } from 'socket.io-client';
import API_CONFIG from '../config';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';

const LiveStream = () => {
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectAccessToken);
  const [streams, setStreams] = useState([
    { _id: 'stream_1', title: 'Tech Hub Connaught Place Store Opening!', host: { name: 'Tech Hub', avatarUrl: 'https://via.placeholder.com/150' }, viewersCount: 42, likesCount: 156 },
    { _id: 'stream_2', title: 'Live Styling Session with Nisha!', host: { name: 'Nisha Style', avatarUrl: 'https://via.placeholder.com/150' }, viewersCount: 18, likesCount: 89 }
  ]);

  const [activeStreamId, setActiveStreamId] = useState(null);
  const [liveChat, setLiveChat] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat room
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveChat]);

  // Connect socket for stream room updates
  useEffect(() => {
    if (!token || !activeStreamId) return;

    const socket = io(API_CONFIG.SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.emit('join_stream', activeStreamId);

    // Initial random comments populate
    setLiveChat([
      { user: { name: 'Gaurav' }, text: 'Wow, great collection!' },
      { user: { name: 'Riya' }, text: 'Where is this shop located?' }
    ]);

    socket.on('stream_message', (msg) => {
      setLiveChat((prev) => [...prev, msg]);
    });

    socket.on('viewer_change', ({ viewersCount }) => {
      setViewers(viewersCount);
    });

    socket.on('likes_change', ({ likesCount }) => {
      setLikes(likesCount);
    });

    socket.on('stream_ended', () => {
      toast.error('The host has ended this live stream.');
      handleExit();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeStreamId]);

  const handleStartStream = () => {
    setIsBroadcasting(true);
    setActiveStreamId('stream_broadcast_001');
    setViewers(1);
    setLikes(0);
    setLiveChat([{ user: { name: 'System' }, text: 'Live stream started. Waiting for viewers...' }]);
  };

  const handleExit = () => {
    if (socketRef.current && activeStreamId) {
      socketRef.current.emit('leave_stream', activeStreamId);
    }
    setActiveStreamId(null);
    setIsBroadcasting(false);
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeStreamId) return;

    const commentMsg = {
      user: { name: user.name, avatarUrl: user.avatarUrl },
      text: commentText,
      createdAt: new Date()
    };

    if (socketRef.current) {
      socketRef.current.emit('stream_message', commentMsg); // Broadcast to stream room
    }

    setLiveChat((prev) => [...prev, commentMsg]);
    setCommentText('');
  };

  const handleLike = () => {
    setLikes(prev => prev + 1);
    if (socketRef.current) {
      socketRef.current.emit('stream_like', { streamId: activeStreamId });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {!activeStreamId ? (
        <>
          {/* ── Directory Header ── */}
          <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-brand-navy font-display">
                Live Broadcasts <span className="gradient-text font-black">Center</span>
              </h2>
              <p className="text-xs text-text-tertiary mt-1">
                Tune in to live product updates, cafe reviews, or start your own catalog campaign.
              </p>
            </div>

            {user?.roles?.includes('vendor') && (
              <Button onClick={handleStartStream} variant="primary" className="flex items-center gap-1.5 text-xs py-2.5 px-5 cursor-pointer">
                <FiWifi /> Go Live Stream
              </Button>
            )}
          </div>

          {/* ── Active streams lists grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {streams.map((stream) => (
              <div key={stream._id} className="glass p-5 rounded-premium border-white/50 shadow-glass flex flex-col gap-4 relative overflow-hidden group">
                <div className="h-44 w-full rounded-premium overflow-hidden bg-black relative">
                  {/* Streaming indicator */}
                  <div className="absolute top-3 left-3 bg-error text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded tracking-widest flex items-center gap-1 z-10 animate-pulse">
                    <FiActivity /> Live
                  </div>
                  
                  <div className="absolute inset-0 bg-brand-navy/60 flex items-center justify-center">
                    <FiTv className="w-10 h-10 text-white/40" />
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-brand-navy font-display line-clamp-1">
                      {stream.title}
                    </h4>
                    <span className="text-[10px] text-text-tertiary mt-0.5">
                      by {stream.host.name}
                    </span>
                  </div>

                  <Button
                    onClick={() => {
                      setActiveStreamId(stream._id);
                      setViewers(stream.viewersCount);
                      setLikes(stream.likesCount);
                    }}
                    variant="secondary"
                    className="text-[10px] py-1.5 px-4 cursor-pointer"
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ── Active Live Stream Window simulator ── */
        <div className="glass h-[calc(100vh-140px)] rounded-premium border-white/50 shadow-glass overflow-hidden grid grid-cols-1 lg:grid-cols-3 bg-black">
          {/* Main stream screen */}
          <div className="lg:col-span-2 relative h-full bg-brand-navy-dark flex items-center justify-center p-4">
            {/* Exit Stream */}
            <button
              onClick={handleExit}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md z-20 cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Video mockup indicator */}
            <div className="absolute top-4 left-4 bg-error text-white text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1.5 tracking-wider animate-pulse z-20">
              <FiActivity /> {isBroadcasting ? 'Broadcasting live' : 'Viewing Broadcast'}
            </div>

            <div className="absolute top-4 left-32 bg-black/40 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 z-20">
              <FiUser /> {viewers} viewers
            </div>

            <div className="absolute top-4 left-56 bg-black/40 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 z-20">
              <FiHeart className="text-brand-pink fill-brand-pink" /> {likes} likes
            </div>

            {/* Simulated Live View Stream Vector */}
            <div className="flex flex-col items-center gap-2 select-none">
              <FiTv className="w-16 h-16 text-white/10 animate-bounce" />
              <p className="text-xs text-white/30 font-bold uppercase tracking-widest">
                {isBroadcasting ? 'Camera Capture Setup active' : 'Connected to host feed'}
              </p>
            </div>

            {/* double tap like zone */}
            <div
              onDoubleClick={handleLike}
              className="absolute inset-0 z-10 cursor-pointer"
            />
          </div>

          {/* Sidebar Chat comments feed */}
          <div className="border-l border-border/10 flex flex-col h-full bg-black/85 text-white">
            <div className="p-4 border-b border-border/10">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                Live Chat
              </h3>
            </div>

            {/* chat list */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 scrollbar-none">
              {liveChat.map((msg, index) => (
                <div key={index} className="text-xs leading-relaxed flex flex-col">
                  <span className="font-extrabold text-brand-orange">
                    @{msg.user?.name}
                  </span>
                  <span className="text-white/90 font-medium">
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendComment} className="p-3 border-t border-border/10 flex items-center gap-2 bg-black">
              <input
                type="text"
                placeholder="Send a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/5 focus:border-brand-purple rounded-full text-xs text-white placeholder-white/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="p-2.5 bg-brand-purple text-white rounded-full cursor-pointer hover:bg-brand-purple-800 disabled:opacity-50 transition-all"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStream;

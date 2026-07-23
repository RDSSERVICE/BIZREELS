const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const logger = require('../utils/logger');

let ioInstance = null;

/**
 * Initializes the Socket.io server with authentication and events mapping.
 */
const initSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  ioInstance = io;

  // Connection Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Extract bearer token structure
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      // Fallback to cookie parser
      if (!token && socket.handshake.headers?.cookie) {
        const cookieMatch = socket.handshake.headers.cookie.match(/accessToken=([^;]+)/);
        if (cookieMatch) {
          token = cookieMatch[1];
        }
      }

      if (!token) {
        return next(new Error('Access denied. No token provided.'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.userId)
        .select('name avatarUrl activeRole roles')
        .lean();

      if (!user) {
        return next(new Error('Authentication failed. User not found.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket authentication error:', { error: err.message, service: 'sockets' });
      return next(new Error('Authentication failed. Invalid token.'));
    }
  });

  // Client events binding
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket client connected: User ID ${userId}`, { service: 'sockets' });

    // Join personal user room to receive targeted alerts (quotes, leads, notifications)
    socket.join(`user:${userId}`);

    // Join admin room if user has admin privileges
    if (socket.user.roles && socket.user.roles.includes('admin')) {
      socket.join('admin');
      logger.info(`Socket User ${userId} joined admin room`, { service: 'sockets' });
    }

    // Join specific conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      logger.info(`Socket User ${userId} joined conversation room: ${conversationId}`, { service: 'sockets' });
    });

    // Leave specific conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      logger.info(`Socket User ${userId} left conversation room: ${conversationId}`, { service: 'sockets' });
    });

    // Handle user typing state broadcasts
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        userName: socket.user.name,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('stop_typing', {
        conversationId,
        userId,
      });
    });

    // Join specific Live Stream room
    socket.on('join_stream', (streamId) => {
      socket.join(`conversation:${streamId}`); // Reuses conversation channel constructs for simple layout broadcasts
      logger.info(`Socket User ${userId} joined stream room: ${streamId}`, { service: 'sockets' });
    });

    // Leave specific Live Stream room
    socket.on('leave_stream', (streamId) => {
      socket.leave(`conversation:${streamId}`);
      logger.info(`Socket User ${userId} left stream room: ${streamId}`, { service: 'sockets' });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: User ID ${userId}`, { service: 'sockets' });
    });
  });

  return io;
};

/**
 * Global utility to emit a real-time event directly to a connected user's room.
 * Useful for controllers/services to push real-time alerts or message notifications.
 */
const emitToUser = (userId, event, payload) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
};

/**
 * Global utility to emit a real-time event to a conversation room.
 */
const emitToConversation = (conversationId, event, payload) => {
  if (ioInstance) {
    ioInstance.to(`conversation:${conversationId}`).emit(event, payload);
  }
};

/**
 * Global utility to emit a real-time event to the general admin room.
 */
const emitToAdmin = (event, payload) => {
  if (ioInstance) {
    ioInstance.to('admin').emit(event, payload);
  }
};

module.exports = {
  initSockets,
  emitToUser,
  emitToConversation,
  emitToAdmin,
};

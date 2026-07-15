const socketIo = require('socket.io');
const { decodeAccessToken } = require('../utils/jwt.utils');
const logger = require('../utils/logger');

let io = null;
const sidToUser = new Map();
const userSids = new Map();

const userRoom = (userId) => `user:${userId}`;
const threadRoom = (threadId) => `thread:${threadId}`;

const initSocket = (server) => {
  io = socketIo(server, {
    path: '/api/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    let token = socket.handshake.auth?.token || socket.handshake.auth?.access_token;
    if (!token) {
      token = socket.handshake.query?.token;
    }
    if (!token) {
      logger.info('socket connect denied: no token');
      return next(new Error('Authentication error'));
    }

    try {
      const payload = decodeAccessToken(token);
      if (payload.type !== 'access') {
        return next(new Error('Invalid token type'));
      }
      socket.userId = payload.sub;
      next();
    } catch (err) {
      logger.info(`socket auth failure: ${err.message}`);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const sid = socket.id;

    sidToUser.set(sid, userId);
    if (!userSids.has(userId)) {
      userSids.set(userId, new Set());
    }
    userSids.get(userId).add(sid);

    socket.join(userRoom(userId));
    logger.info(`socket connected: user=${userId} sid=${sid}`);
    socket.emit('connected', { user_id: userId });

    socket.on('disconnect', () => {
      sidToUser.delete(sid);
      if (userSids.has(userId)) {
        userSids.get(userId).delete(sid);
        if (userSids.get(userId).size === 0) {
          userSids.delete(userId);
        }
      }
      logger.info(`socket disconnected: user=${userId} sid=${sid}`);
    });

    socket.on('thread:join', (data) => {
      const threadId = data?.thread_id;
      if (threadId) {
        socket.join(threadRoom(threadId));
      }
    });

    socket.on('thread:leave', (data) => {
      const threadId = data?.thread_id;
      if (threadId) {
        socket.leave(threadRoom(threadId));
      }
    });

    socket.on('typing', (data) => {
      const threadId = data?.thread_id;
      const isTyping = !!data?.is_typing;
      if (threadId) {
        socket.to(threadRoom(threadId)).emit('thread:typing', {
          thread_id: threadId,
          user_id: userId,
          is_typing: isTyping,
        });
      }
    });
  });

  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userRoom(userId)).emit(event, data);
  }
};

const isOnline = (userId) => {
  return userSids.has(userId) && userSids.get(userId).size > 0;
};

module.exports = {
  initSocket,
  emitToUser,
  isOnline,
};

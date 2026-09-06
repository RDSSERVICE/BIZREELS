const { emitToUser, emitToConversation, getIO, isUserOnline } = require('../sockets');

const isOnline = (userId) => {
  if (!userId) return false;
  return typeof isUserOnline === 'function' ? isUserOnline(userId) : false;
};

module.exports = {
  emitToUser,
  emitToConversation,
  isOnline,
  isUserOnline,
};


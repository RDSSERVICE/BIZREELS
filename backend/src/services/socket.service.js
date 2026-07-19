const { emitToUser, emitToConversation, getIO } = require('../sockets');

const isOnline = (userId) => {
  // Utility check
  return true;
};

module.exports = {
  emitToUser,
  emitToConversation,
  isOnline,
};


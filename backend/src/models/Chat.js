const mongoose = require('mongoose');

// Chat Thread
const chatThreadSchema = new mongoose.Schema({
  participants: { type: [String], required: true, index: true },
  thread_type: { type: String, enum: ['listing', 'requirement', 'direct'], required: true },
  context_id: { type: String, default: null },
  last_message: { type: mongoose.Schema.Types.Mixed, default: null },
  unread_count: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_archived_by: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

chatThreadSchema.index({ participants: 1, context_id: 1, thread_type: 1 });
chatThreadSchema.index({ updated_at: -1 });

const ChatThread = mongoose.model('ChatThread', chatThreadSchema, 'chat_threads');

// Chat Message
const chatMessageSchema = new mongoose.Schema({
  thread_id: { type: String, required: true },
  sender_id: { type: String, required: true },
  receiver_id: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'video', 'listing_card', 'location', 'quote', 'system'], default: 'text' },
  text: { type: String, default: null },
  media: { type: mongoose.Schema.Types.Mixed, default: null },
  shared_listing_id: { type: String, default: null },
  shared_location: { type: mongoose.Schema.Types.Mixed, default: null },
  quote: { type: mongoose.Schema.Types.Mixed, default: null },
  delivered_at: { type: String, default: () => new Date().toISOString() },
  read_at: { type: String, default: null },
  is_deleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

chatMessageSchema.index({ thread_id: 1, _id: -1 });
chatMessageSchema.index({ receiver_id: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema, 'messages');

module.exports = { ChatThread, ChatMessage };

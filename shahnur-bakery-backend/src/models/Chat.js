const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000,
        },
        type: {
          type: String,
          enum: ['text', 'image', 'file'],
          default: 'text',
        },
        fileUrl: String,
        isRead: {
          type: Boolean,
          default: false,
        },
        readAt: Date,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Yangi xabar qo'shilganda lastMessage ni yangilash
chatSchema.pre('save', function (next) {
  if (this.isModified('messages') && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = {
      content: lastMsg.content,
      sender: lastMsg.sender,
      timestamp: lastMsg.createdAt || new Date(),
    };
  }
  next();
});

module.exports = mongoose.model('Chat', chatSchema);

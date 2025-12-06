const mongoose = require('mongoose');

const SiteMessageSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['recharge', 'withdrawal', 'trade', 'system', 'admin'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId // Reference to recharge/withdrawal/trade
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteMessage', SiteMessageSchema);
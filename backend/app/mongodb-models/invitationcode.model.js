const mongoose = require('mongoose');

const InvitationCodeSchema = mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  generatedBy: {
    type: String, // Admin username
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: String, // Username who used this code
    default: ''
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InvitationCode', InvitationCodeSchema);
const mongoose = require('mongoose');

const RechargeSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  channel: {
    type: String,
    default: 'Channel 01'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminNote: {
    type: String,
    default: ''
  },
  processedBy: {
    type: String, // Admin username who processed
    default: ''
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Recharge', RechargeSchema);
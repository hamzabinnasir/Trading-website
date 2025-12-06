const mongoose = require('mongoose');

const WithdrawalSchema = mongoose.Schema({
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
  walletType: {
    type: String,
    enum: ['bank', 'digital'],
    required: true
  },
  walletDetails: {
    // For bank withdrawals
    holderName: String,
    bankName: String,
    accountNo: String,
    ifscCode: String,
    // For digital withdrawals
    currency: String,
    classification: String,
    address: String
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

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
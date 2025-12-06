const mongoose = require('mongoose');

const FundHistorySchema = mongoose.Schema({
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
  fundType: {
    type: String,
    enum: ['user_order', 'order_profit', 'recharge', 'withdrawal'],
    required: true
  },
  transactionType: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId // Reference to trade/recharge/withdrawal
  },
  description: {
    type: String
  },
  balanceAfter: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FundHistory', FundHistorySchema);
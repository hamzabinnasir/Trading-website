const mongoose = require('mongoose');

const TradeSchema = mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  orderAmount: {
    type: Number,
    required: true
  },
  profitAmount: {
    type: Number,
    required: true
  },
  direction: {
    type: String,
    required: true
  },
  scale: {
    type: String,
    required: true
  },
  billingTime: {
    type: String,
    required: true
  },
  orderTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Closed', 'Cancelled'],
    default: 'Pending'
  },
  endTime: {
    type: Date,
    required: true
  },
  result_isWin: {
    type: Boolean,
    default: true
  },
  result_payout: {
    type: Number,
    required: true
  },
  // ADD THIS FIELD
  balanceUpdated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trade', TradeSchema);
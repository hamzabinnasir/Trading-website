const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      username: String,
      email: String,
      password: String,
      fundPassword: String, // NEW: For withdrawal authentication
      roles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role"
        }
      ],
      status: { type: String, default: 'active' }, // 'pending_approval', 'pending_verification', 'active'
      invitationCode: { type: String },
      isFrozen: { type: Boolean, default: false },
      isOnline: { type: Boolean, default: false },

      // Balance and Coin Holdings
      balance: { type: Number, default: 10000.0 },
      bitcoin: { type: Number, default: 0 },
      dash: { type: Number, default: 0 },
      monero: { type: Number, default: 0 },
      ethereum: { type: Number, default: 0 },
      xrp: { type: Number, default: 0 },
      tether: { type: Number, default: 0 },
      bitcoinCash: { type: Number, default: 0 },
      bitcoinSV: { type: Number, default: 0 },
      litecoin: { type: Number, default: 0 },
      eos: { type: Number, default: 0 },
      binancecoin: { type: Number, default: 0 },
      tezos: { type: Number, default: 0 },

      // Profile Fields
      gender: { type: String, default: "Male" },
      signature: { type: String, default: "Not set" },
      avatar: { type: String, default: "" },

      // Wallet Arrays
      digitalWallets: [
        {
          currency: String,
          classification: String,
          address: String,
          comment: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      bankWallets: [
        {
          holderName: String,
          bankName: String,
          accountNo: String,
          ifscCode: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    {
      timestamps: true,
    }
  )
);

module.exports = User;

const mongoose = require("mongoose");

const AccessRequest = mongoose.model(
    "AccessRequest",
    new mongoose.Schema({
        name: { type: String, required: false }, // Optional for registration flow
        username: { type: String, required: false }, // Added for registration flow
        email: { type: String, required: true },
        password: { type: String, required: true }, // Required for registration flow
        fundPassword: { type: String, required: true }, // Required for registration flow
        reason: { type: String, required: false }, // Optional for registration flow
        requestType: { type: String, default: 'manual' }, // 'manual' or 'registration'
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        },
        requestedAt: { type: Date, default: Date.now }
    })
);

module.exports = AccessRequest;

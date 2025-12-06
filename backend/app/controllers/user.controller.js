// backend/app/controllers/user.controller.js

const db = require("../mongodb-models");
const mongoose = require("mongoose");
const User = db.user;
const exchange = require("../middlewares/exchange");

// --- EXISTING FUNCTIONS (Cleaned up) ---

exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
    res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
    res.status(200).send("Moderator Content.");
};

// 1. GET USER BALANCE/PORTFOLIO - FIXED: Get username from token
exports.getUserBalance = (req, res) => {
    const userId = req.userId;

    console.log("🔍 Fetching balance for user ID:", userId);

    // Validate if userId is a proper ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error("❌ Invalid user ID format:", userId);
        return res.status(400).send({ message: "Invalid user ID format" });
    }

    User.findById(userId)
        .exec((err, user) => {
            if (err) {
                console.error("❌ Database error finding user:", err);
                return res.status(500).send({ message: err });
            }
            if (!user) {
                console.log("❌ User not found for ID:", userId);

                // Try to find by username as fallback (for debugging)
                User.find({}).then(users => {
                    console.log("📋 All users in database:");
                    users.forEach(u => {
                        console.log(`- ${u.username} (ID: ${u._id})`);
                    });
                });

                return res.status(404).send({ message: "User Not found." });
            }

            console.log("✅ Found user:", user.username);
            console.log("💰 User balance:", user.balance);

            return res.status(200).send({
                username: user.username,
                balance: user.balance,
                bitcoin: user.bitcoin,
                dash: user.dash,
                monero: user.monero,
                ethereum: user.ethereum,
                xrp: user.xrp,
                tether: user.tether,
                bitcoinCash: user.bitcoinCash,
                bitcoinSV: user.bitcoinSV,
                litecoin: user.litecoin,
                eos: user.eos,
                binancecoin: user.binancecoin,
                tezos: user.tezos
            });
        });
};

// 2. GET USER VALUE - FIXED: Get username from token
exports.getUserValue = (req, res) => {
    const username = req.userId;

    User.findById(username).exec((err, user) => {
        if (err) return res.status(500).send({ message: err });
        if (!user) return res.status(404).send({ message: "User Not found" });

        return res.status(200).send({
            username: user.username,
            balance: user.balance,
            uservalue: user.balance
        });
    });
};

// 3. UPDATE USER BALANCE - FIXED: Get username from token
exports.updateBalance = async (req, res) => {
    try {
        const username = req.userId;
        const { newBalance } = req.body;

        console.log("Updating balance for user:", username, "New balance:", newBalance);

        const user = await User.findById(username);
        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        user.balance = parseFloat(newBalance);
        await user.save();

        console.log("Balance updated successfully. New balance:", user.balance);

        res.status(200).send({
            message: "Balance updated successfully!",
            balance: user.balance
        });
    } catch (error) {
        console.error("Error updating balance:", error);
        res.status(500).send({ message: error.message });
    }
};

// 4. GET USER BALANCE (Simple version) - Keep for compatibility
exports.getUserBalanceSimple = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).send({ message: "User Not found." });
        }

        res.status(200).send({
            balance: user.balance
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// 5. UPDATE USER BALANCE (Legacy function - keep for compatibility)
exports.updateUserBalance = (req, res) => {
    if (!req.body || !req.body.username || req.body.newBalance === undefined) {
        return res.status(400).send({ message: "Username and newBalance are required" });
    }

    User.findOne({ username: req.body.username })
        .exec((err, user) => {
            if (err) return res.status(500).send({ message: err });
            if (!user) return res.status(404).send({ message: "User Not found." });

            user.balance = parseFloat(req.body.newBalance);

            user.save((err) => {
                if (err) return res.status(500).send({ message: err });
                res.status(200).send({
                    message: "Balance updated successfully!",
                    balance: user.balance
                });
            });
        });
};

// --- NEW PROFILE & WALLET FUNCTIONS ---

// 6. GET USER PROFILE (Includes Wallets & Gender) - FIXED: Get username from token
exports.getUserProfile = (req, res) => {
    const username = req.userId;

    User.findById(username)
        .exec((err, user) => {
            if (err) return res.status(500).send({ message: err });
            if (!user) return res.status(404).send({ message: "User Not found." });

            res.status(200).send({
                id: user._id,
                username: user.username,
                balance: user.balance,
                gender: user.gender,
                signature: user.signature,
                avatar: user.avatar,
                digitalWallets: user.digitalWallets,
                bankWallets: user.bankWallets
            });
        });
};

// 7. UPDATE PROFILE INFO (Gender/Signature) - FIXED: Get username from token
exports.updateProfile = (req, res) => {
    const username = req.userId;
    const { gender, signature } = req.body;

    const updateData = {};
    if (gender !== undefined) updateData.gender = gender;
    if (signature !== undefined) updateData.signature = signature;

    User.findByIdAndUpdate(
        username,
        { $set: updateData },
        { new: true, useFindAndModify: false }
    ).exec((err, user) => {
        if (err) return res.status(500).send({ message: err });
        if (!user) return res.status(404).send({ message: "User not found" });

        res.status(200).send({
            message: "Profile updated successfully!",
            user: {
                gender: user.gender,
                signature: user.signature
            }
        });
    });
};

// 8. ADD WALLET - FIXED: Get username from token
exports.addWallet = (req, res) => {
    const username = req.userId;
    const { type, ...walletData } = req.body;

    if (!type) {
        return res.status(400).send({ message: "Wallet type is required" });
    }

    // Validate required fields based on type
    if (type === 'digital') {
        if (!walletData.currency || !walletData.address) {
            return res.status(400).send({ message: "Currency and address are required for digital wallets" });
        }
    } else if (type === 'bank') {
        if (!walletData.holderName || !walletData.bankName || !walletData.accountNo) {
            return res.status(400).send({ message: "Holder name, bank name, and account number are required for bank wallets" });
        }
    }

    const updateQuery = type === 'digital'
        ? { $push: { digitalWallets: { ...walletData, _id: new mongoose.Types.ObjectId() } } }
        : { $push: { bankWallets: { ...walletData, _id: new mongoose.Types.ObjectId() } } };

    User.findByIdAndUpdate(
        username,
        updateQuery,
        { new: true, useFindAndModify: false }
    ).exec((err, user) => {
        if (err) return res.status(500).send({ message: err });
        if (!user) return res.status(404).send({ message: "User not found" });

        const wallets = type === 'digital' ? user.digitalWallets : user.bankWallets;
        const newWallet = wallets[wallets.length - 1];

        res.status(200).send({
            message: "Wallet added successfully",
            wallet: newWallet
        });
    });
};

// 9. UPDATE WALLET - FIXED: Get username from token
exports.updateWallet = (req, res) => {
    const username = req.userId;
    const { type, walletId, ...data } = req.body;

    if (!type || !walletId) {
        return res.status(400).send({ message: "Wallet type and wallet ID are required" });
    }

    let filter = { _id: username };
    let updateQuery = {};

    if (type === 'digital') {
        filter["digitalWallets._id"] = walletId;
        updateQuery = {
            $set: {
                "digitalWallets.$.currency": data.currency,
                "digitalWallets.$.classification": data.classification,
                "digitalWallets.$.address": data.address,
                "digitalWallets.$.comment": data.comment
            }
        };
    } else {
        filter["bankWallets._id"] = walletId;
        updateQuery = {
            $set: {
                "bankWallets.$.holderName": data.holderName,
                "bankWallets.$.bankName": data.bankName,
                "bankWallets.$.accountNo": data.accountNo,
                "bankWallets.$.ifscCode": data.ifscCode
            }
        };
    }

    User.findOneAndUpdate(filter, updateQuery, { new: true, useFindAndModify: false })
        .exec((err, user) => {
            if (err) return res.status(500).send({ message: err });
            if (!user) return res.status(404).send({ message: "User not found" });

            res.status(200).send({
                message: "Wallet updated successfully",
                wallet: data
            });
        });
};

// 10. DELETE WALLET - FIXED: Get username from token
exports.deleteWallet = (req, res) => {
    const username = req.userId;
    const { type, walletId } = req.body;

    if (!type || !walletId) {
        return res.status(400).send({ message: "Wallet type and wallet ID are required" });
    }

    const updateQuery = type === 'digital'
        ? { $pull: { digitalWallets: { _id: walletId } } }
        : { $pull: { bankWallets: { _id: walletId } } };

    User.findByIdAndUpdate(
        username,
        updateQuery,
        { new: true, useFindAndModify: false }
    ).exec((err, user) => {
        if (err) return res.status(500).send({ message: err });
        if (!user) return res.status(404).send({ message: "User not found" });

        res.status(200).send({ message: "Wallet deleted successfully" });
    });
};

// --- TRADING FUNCTIONS (Buy/Sell/Verify) - FIXED: Get username from token ---

exports.buy = (req, res) => {
    const username = req.userId;
    const coin = req.body.coin;

    exchange.getCurrentPrice(coin).then(function (response) {
        let coinsBought = parseFloat(req.body.value) / parseFloat(response.data[0].price_usd);
        let myquery = { balance: -req.body.value };
        myquery[req.body.coin] = coinsBought;

        User.findByIdAndUpdate(
            username,
            { $inc: myquery },
            { new: true }
        ).exec((err, user) => {
            if (err) return res.status(500).send({ message: err });
            if (!user) return res.status(404).send({ message: "User Not found." });
            res.status(200).send({ balance: user.balance, coinsBought: coinsBought });
        });
    }).catch(err => {
        res.status(500).send({ message: "Price fetch failed" });
    });
};

exports.sell = (req, res) => {
    const username = req.userId;
    const coinsSold = req.coinsSold;
    let myquery = { balance: req.body.value };
    myquery[req.body.coin] = -coinsSold;

    User.findByIdAndUpdate(
        username,
        { $inc: myquery },
        { new: true }
    ).exec((err, user) => {
        if (err) return res.status(500).send({ message: err });
        if (!user) return res.status(404).send({ message: "User Not found." });
        res.status(200).send({ balance: user.balance, coinsSold: coinsSold });
    });
};

exports.verifyBalance = (req, res, next) => {
    const username = req.userId;

    User.findById(username).exec((err, user) => {
        if (err) return res.status(500).send({ message: err });
        if (!user) return res.status(404).send({ message: "User Not found" });
        if (req.body.value > user.balance) {
            return res.status(400).send({ message: "Insufficient funds." });
        }
        next();
    });
};

exports.verifyCoins = (req, res, next) => {
    const username = req.userId;

    User.findById(username).exec((err, user) => {
        if (err) return res.status(500).send({ message: err });
        exchange.getCurrentPrice(req.body.coin).then(function (response) {
            const coinsSold = parseFloat(req.body.value) / parseFloat(response.data[0].price_usd);
            const coinBalance = user[req.body.coin] || 0;
            if (coinsSold > coinBalance) {
                return res.status(400).send({ message: "Insufficient coins." });
            }
            req.coinsSold = coinsSold;
            next();
        }).catch(err => res.status(500).send({ message: "Price Error" }));
    });
};
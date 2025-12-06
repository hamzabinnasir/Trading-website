const db = require("../mongodb-models");
const User = db.user;
const Recharge = db.recharge;
const Withdrawal = db.withdrawal;
const SiteMessage = db.sitemessage;
const FundHistory = db.fundhistory;
const bcrypt = require("bcryptjs");
// ✅ ADD THESE TWO BASIC FUNCTIONS THAT YOUR FRONTEND EXPECTS
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -fundPassword');
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateWallet = async (req, res) => {
  try {
    const { walletType, walletData } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Handle digital wallet
    if (walletType === 'digital') {
      if (!user.digitalWallets) user.digitalWallets = [];
      user.digitalWallets.push(walletData);
    }
    
    // Handle bank wallet
    if (walletType === 'bank') {
      if (!user.bankWallets) user.bankWallets = [];
      user.bankWallets.push(walletData);
    }

    await user.save();
    res.status(200).send({ message: "Wallet added successfully", user });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Keep your existing functions...
exports.getCompleteProfile = async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username })
      .populate('roles')
      .exec();

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      gender: user.gender,
      signature: user.signature,
      avatar: user.avatar,
      digitalWallets: user.digitalWallets,
      bankWallets: user.bankWallets,
      isFrozen: user.isFrozen,
      isOnline: user.isOnline,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
// Get complete user profile with all data
exports.getCompleteProfile = async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username })
      .populate('roles')
      .exec();

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      gender: user.gender,
      signature: user.signature,
      avatar: user.avatar,
      digitalWallets: user.digitalWallets,
      bankWallets: user.bankWallets,
      isFrozen: user.isFrozen,
      isOnline: user.isOnline,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update profile information
exports.updateProfileInfo = async (req, res) => {
  try {
    const { username, gender, signature, avatar } = req.body;

    const user = await User.findOneAndUpdate(
      { username },
      { 
        $set: { 
          gender: gender || 'Male',
          signature: signature || 'Not set',
          avatar: avatar || ''
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({
      message: "Profile updated successfully",
      profile: {
        gender: user.gender,
        signature: user.signature,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Change login password
exports.changeLoginPassword = async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const passwordIsValid = bcrypt.compareSync(currentPassword, user.password);
    if (!passwordIsValid) {
      return res.status(400).send({ message: "Current password is incorrect" });
    }

    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();

    res.status(200).send({ message: "Login password updated successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Change fund password
exports.changeFundPassword = async (req, res) => {
  try {
    const { username, currentFundPassword, newFundPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // For first time setup, if no fund password is set
    if (user.fundPassword && currentFundPassword) {
      const fundPasswordIsValid = bcrypt.compareSync(currentFundPassword, user.fundPassword);
      if (!fundPasswordIsValid) {
        return res.status(400).send({ message: "Current fund password is incorrect" });
      }
    }

    user.fundPassword = bcrypt.hashSync(newFundPassword, 8);
    await user.save();

    res.status(200).send({ message: "Fund password updated successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Verify fund password
exports.verifyFundPassword = async (req, res) => {
  try {
    const { username, fundPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (!user.fundPassword) {
      return res.status(400).send({ message: "Fund password not set" });
    }

    const fundPasswordIsValid = bcrypt.compareSync(fundPassword, user.fundPassword);
    if (!fundPasswordIsValid) {
      return res.status(400).send({ message: "Fund password is incorrect" });
    }

    res.status(200).send({ message: "Fund password verified successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get user's site messages
exports.getSiteMessages = async (req, res) => {
  try {
    const username = req.params.username;

    const messages = await SiteMessage.find({ username })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).send(messages);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Mark message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await SiteMessage.findByIdAndUpdate(
      messageId,
      { $set: { isRead: true } },
      { new: true }
    );

    if (!message) {
      return res.status(404).send({ message: "Message not found" });
    }

    res.status(200).send({ message: "Message marked as read", message });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
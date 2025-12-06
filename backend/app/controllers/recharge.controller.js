const db = require("../mongodb-models");
const Recharge = db.recharge;
const User = db.user;
const SiteMessage = db.sitemessage;
const FundHistory = db.fundhistory;

// Create recharge request
exports.createRecharge = async (req, res) => {
  try {
    const { amount, channel } = req.body;
    const userId = req.userId; // Get userId from auth middleware

    // Check if user exists and is not frozen
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (user.isFrozen) {
      return res.status(400).send({ message: "Account is frozen. Cannot recharge." });
    }

    const recharge = new Recharge({
      userId: user._id,
      username: user.username,
      amount: parseFloat(amount),
      channel: channel || 'Channel 01'
    });

    await recharge.save();

    // Create site message for user
    const siteMessage = new SiteMessage({
      userId: user._id,
      username: user.username,
      title: "Recharge Request Submitted",
      message: `Your recharge request for $${amount} has been submitted and is pending admin approval.`,
      messageType: 'recharge',
      relatedId: recharge._id
    });
    await siteMessage.save();

    res.status(200).send({
      message: "Recharge request submitted successfully",
      recharge: recharge
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get user's recharge history
exports.getUserRecharges = async (req, res) => {
  try {
    const username = req.params.username;

    const recharges = await Recharge.find({ username })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).send(recharges);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all recharge requests (for admin)
exports.getAllRecharges = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const recharges = await Recharge.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).send(recharges);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Admin: Approve recharge
exports.approveRecharge = async (req, res) => {
  try {
    const { rechargeId, adminUsername, note } = req.body;

    const recharge = await Recharge.findById(rechargeId);
    if (!recharge) {
      return res.status(404).send({ message: "Recharge request not found" });
    }

    if (recharge.status !== 'Pending') {
      return res.status(400).send({ message: "Recharge request already processed" });
    }

    // Update user balance
    const user = await User.findById(recharge.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.balance += recharge.amount;
    await user.save();

    // Update recharge status
    recharge.status = 'Approved';
    recharge.processedBy = adminUsername;
    recharge.processedAt = new Date();
    recharge.adminNote = note || '';
    await recharge.save();

    // Create fund history record
    const fundHistory = new FundHistory({
      userId: user._id,
      username: user.username,
      amount: recharge.amount,
      fundType: 'recharge',
      transactionType: 'credit',
      relatedId: recharge._id,
      description: `Recharge approved by admin`,
      balanceAfter: user.balance
    });
    await fundHistory.save();

    // Create site message for user
    const siteMessage = new SiteMessage({
      userId: user._id,
      username: user.username,
      title: "Recharge Approved",
      message: `Your recharge request for $${recharge.amount} has been approved. Your new balance is $${user.balance}.`,
      messageType: 'recharge',
      relatedId: recharge._id
    });
    await siteMessage.save();

    res.status(200).send({
      message: "Recharge approved successfully",
      recharge: recharge,
      userBalance: user.balance
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Admin: Reject recharge
exports.rejectRecharge = async (req, res) => {
  try {
    const { rechargeId, adminUsername, note } = req.body;

    const recharge = await Recharge.findById(rechargeId);
    if (!recharge) {
      return res.status(404).send({ message: "Recharge request not found" });
    }

    if (recharge.status !== 'Pending') {
      return res.status(400).send({ message: "Recharge request already processed" });
    }

    recharge.status = 'Rejected';
    recharge.processedBy = adminUsername;
    recharge.processedAt = new Date();
    recharge.adminNote = note || 'Recharge request rejected';
    await recharge.save();

    // Create site message for user
    const siteMessage = new SiteMessage({
      userId: recharge.userId,
      username: recharge.username,
      title: "Recharge Rejected",
      message: `Your recharge request for $${recharge.amount} has been rejected. Reason: ${recharge.adminNote}`,
      messageType: 'recharge',
      relatedId: recharge._id
    });
    await siteMessage.save();

    res.status(200).send({
      message: "Recharge rejected successfully",
      recharge: recharge
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
const db = require("../mongodb-models");
const Withdrawal = db.withdrawal;
const User = db.user;
const SiteMessage = db.sitemessage;
const FundHistory = db.fundhistory;

// Create withdrawal request
// Create withdrawal request
exports.createWithdrawal = async (req, res) => {
  try {
    console.log("🔍 Raw req.body:", req.body);
    
    // ✅ Handle both nested and non-nested data
    let amount, walletType, walletDetails, fundPassword, withdrawalChannel;
    
    // Check if data is nested inside 'amount' property
    if (req.body.amount && typeof req.body.amount === 'object') {
      console.log("⚠️ Data is nested inside 'amount' property");
      const nestedData = req.body.amount;
      amount = nestedData.amount;
      walletType = nestedData.walletType;
      walletDetails = nestedData.walletDetails;
      fundPassword = nestedData.fundPassword;
      withdrawalChannel = nestedData.withdrawalChannel;
    } else {
      // Data is NOT nested
      amount = req.body.amount;
      walletType = req.body.walletType;
      walletDetails = req.body.walletDetails;
      fundPassword = req.body.fundPassword;
      withdrawalChannel = req.body.withdrawalChannel;
    }
    
    const userId = req.userId;
    
    console.log("🔍 Extracted values:", {
      userId, amount, walletType, walletDetails, fundPassword, withdrawalChannel
    });
    
    // Validate input
    if (!userId || !amount || !walletType || !walletDetails || !fundPassword) {
      console.log("❌ Missing fields!");
      return res.status(400).send({ 
        message: "All fields are required for withdrawal",
        missing: {
          userId: !userId,
          amount: !amount,
          walletType: !walletType,
          walletDetails: !walletDetails,
          fundPassword: !fundPassword
        }
      });
    }

    if (amount <= 0) {
      return res.status(400).send({ message: "Withdrawal amount must be positive" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.balance < amount) {
      return res.status(400).send({ message: "Insufficient balance for withdrawal" });
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId: user._id,
      username: user.username,
      amount,
      walletType,
      walletDetails,
      status: 'Pending'
    });
    await withdrawal.save();

    // ✅ FIX: Create SiteMessage for user with valid messageType 'withdrawal'
    const siteMessage = new SiteMessage({
      userId: user._id,
      username: user.username,
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal request for $${amount} has been submitted and is pending admin approval.`,
      messageType: 'withdrawal', // Valid enum value
      relatedId: withdrawal._id
    });
    await siteMessage.save();

    // ✅ OPTIONAL: If you want admin notifications, you need to handle them differently
    // Option 1: Create a special admin user for notifications
    // Option 2: Create a separate AdminNotification model
    // Option 3: Skip admin notification for now
    
    // For now, let's skip admin notification since SiteMessage requires userId
    // Or create a system admin user ID if you have one
    try {
      // Try to find an admin user
      const adminUser = await User.findOne({ roles: 'admin' }).limit(1);
      if (adminUser) {
        const adminSiteMessage = new SiteMessage({
          userId: adminUser._id,
          username: adminUser.username,
          title: "New Withdrawal Request",
          message: `User ${user.username} has submitted a withdrawal request for $${amount}.`,
          messageType: 'admin', // Valid enum value
          relatedId: withdrawal._id
        });
        await adminSiteMessage.save();
      }
    } catch (adminError) {
      console.log("⚠️ Could not create admin notification:", adminError.message);
      // Continue without admin notification
    }

    res.status(200).send({
      message: "Withdrawal request submitted successfully",
      withdrawal
    });

  } catch (error) {
    console.error("❌ Withdrawal creation error:", error);
    res.status(500).send({ message: error.message });
  }
};


// Get user's withdrawal history
exports.getUserWithdrawals = async (req, res) => {
  try {
    const username = req.params.username;


    const withdrawals = await Withdrawal.find({ username })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).send(withdrawals);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all withdrawal requests (for admin)
exports.getAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'username email balance')
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).send(withdrawals);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Admin: Approve withdrawal
exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, adminUsername, note } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).send({ message: "Withdrawal request not found" });
    }

    if (withdrawal.status !== 'Pending') {
      return res.status(400).send({ message: "Withdrawal request already processed" });
    }

    // Update user balance
    const user = await User.findById(withdrawal.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.balance < withdrawal.amount) {
      return res.status(400).send({ message: "User has insufficient balance" });
    }

    user.balance -= withdrawal.amount;
    await user.save();

    // Update withdrawal status
    withdrawal.status = 'Approved';
    withdrawal.processedBy = adminUsername;
    withdrawal.processedAt = new Date();
    withdrawal.adminNote = note || '';
    await withdrawal.save();

    // Create fund history record
    const fundHistory = new FundHistory({
      userId: user._id,
      username: user.username,
      amount: -withdrawal.amount, // Negative for withdrawal
      fundType: 'withdrawal',
      transactionType: 'debit',
      relatedId: withdrawal._id,
      description: `Withdrawal approved by admin`,
      balanceAfter: user.balance
    });
    await fundHistory.save();

    // Create site message for user
    const siteMessage = new SiteMessage({
      userId: user._id,
      username: user.username,
      title: "Withdrawal Approved",
      message: `Your withdrawal request for $${withdrawal.amount} has been approved. Your new balance is $${user.balance}.`,
      messageType: 'withdrawal',
      relatedId: withdrawal._id
    });
    await siteMessage.save();

    res.status(200).send({
      message: "Withdrawal approved successfully",
      withdrawal: withdrawal,
      userBalance: user.balance
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Admin: Reject withdrawal
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId, adminUsername, note } = req.body;

    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).send({ message: "Withdrawal request not found" });
    }

    if (withdrawal.status !== 'Pending') {
      return res.status(400).send({ message: "Withdrawal request already processed" });
    }

    withdrawal.status = 'Rejected';
    withdrawal.processedBy = adminUsername;
    withdrawal.processedAt = new Date();
    withdrawal.adminNote = note || 'Withdrawal request rejected';
    await withdrawal.save();

    // Create site message for user
    const siteMessage = new SiteMessage({
      userId: withdrawal.userId,
      username: withdrawal.username,
      title: "Withdrawal Rejected",
      message: `Your withdrawal request for $${withdrawal.amount} has been rejected. Reason: ${withdrawal.adminNote}`,
      messageType: 'withdrawal',
      relatedId: withdrawal._id
    });
    await siteMessage.save();

    res.status(200).send({
      message: "Withdrawal rejected successfully",
      withdrawal: withdrawal
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
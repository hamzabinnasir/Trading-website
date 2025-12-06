const db = require("../mongodb-models");
const User = db.user;
const Role = db.role;
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({
        message: "Username and password are required!"
      });
    }

    const user = await User.findOne({ username: username })
      .populate("roles", "-__v")
      .exec();

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    const isAdmin = user.roles.some(role => role.name === "admin");
    if (!isAdmin) {
      return res.status(403).send({ message: "Require Admin Role!" });
    }

    const passwordIsValid = password === user.password;

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        roles: user.roles.map(role => role.name)
      },
      config.secret,
      { expiresIn: "24h" }
    );

    // ✅ Set admin online
    user.isOnline = true;
    await user.save();

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles.map(role => role.name),
      accessToken: token,
      message: "Admin login successful!"
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const frozenUsers = await User.countDocuments({ isFrozen: true });

    const pendingRecharges = 0;
    const pendingWithdrawals = 0;
    const pendingTrades = 0;

    const users = await User.find({}, 'balance');
    const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

    res.status(200).send({
      totalUsers,
      onlineUsers,
      frozenUsers,
      pendingRecharges,
      pendingWithdrawals,
      pendingTrades,
      totalBalance
    });

  } catch (error) {
  }
};

exports.toggleUserFreeze = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.isFrozen = !user.isFrozen;
    await user.save();

    res.status(200).send({
      message: `User ${user.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
      user: {
        _id: user._id,
        username: user.username,
        isFrozen: user.isFrozen
      }
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.setUserOffline = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.isOnline = false;
    await user.save();

    res.status(200).send({
      message: "User set to offline successfully",
      user: {
        _id: user._id,
        username: user.username,
        isOnline: user.isOnline
      }
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deductFromUser = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).send({ message: "Valid userId and amount are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (user.balance < amount) {
      return res.status(400).send({ message: "Insufficient balance" });
    }

    user.balance -= parseFloat(amount);
    await user.save();

    res.status(200).send({
      message: `Amount $${amount} deducted successfully`,
      newBalance: user.balance,
      reason: reason
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// ✅ ADDED: Add balance to user
exports.addBalanceToUser = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).send({ message: "Valid userId and amount are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.balance += parseFloat(amount);
    await user.save();

    res.status(200).send({
      message: `Amount $${amount} added successfully`,
      newBalance: user.balance,
      reason: reason
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.sendMessageToUser = async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    res.status(200).send({
      message: "Message sent to user successfully",
      toUser: userId,
      title: title
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.generateInvitationCode = async (req, res) => {
  try {
    const { username, password } = req.body;

    const invitationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    res.status(200).send({
      message: "Invitation code generated successfully",
      invitationCode: invitationCode,
      forUser: username
    });

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getAllInvitationCodes = async (req, res) => {
  try {
    res.status(200).send([]);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('username email balance isOnline isFrozen createdAt invitationCode')
      .populate("roles", "name")
      .exec();

    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance || 0,
      isOnline: user.isOnline || false,
      isFrozen: user.isFrozen || false,
      roles: user.roles.map(role => role.name),
      createdAt: user.createdAt,
      invitationCode: user.invitationCode || 'N/A'
    }));

    res.status(200).send(formattedUsers);

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
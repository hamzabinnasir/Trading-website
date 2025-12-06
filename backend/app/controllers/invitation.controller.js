const db = require("../mongodb-models");
const User = db.user;
const InvitationCode = db.invitationcode;
const Role = db.role;
const bcrypt = require("bcryptjs");

exports.registerWithInvitation = async (req, res) => {
  try {
    const { username, email, password, fundPassword, invitationCode } = req.body;

    // Validate required fields
    if (!username || !email || !password || !fundPassword || !invitationCode) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // Verify invitation code
    const invitation = await InvitationCode.findOne({ 
      code: invitationCode,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(400).send({ message: "Invalid or expired invitation code" });
    }

    if (invitation.username !== username) {
      return res.status(400).send({ message: "Username does not match invitation code" });
    }

    // Verify password matches the one set by admin
    const passwordIsValid = bcrypt.compareSync(password, invitation.password);
    if (!passwordIsValid) {
      return res.status(400).send({ message: "Invalid password for this invitation" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send({ message: "Username already exists" });
    }

    // Get user role
    const userRole = await Role.findOne({ name: "user" });
    if (!userRole) {
      return res.status(500).send({ message: "User role not found" });
    }

    const user = new User({
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      fundPassword: bcrypt.hashSync(fundPassword, 8),
      balance: 10000.00,
      roles: [userRole._id],
      invitationCode: invitationCode,
      isOnline: true
    });

    await user.save();

    // Mark invitation code as used
    invitation.isUsed = true;
    invitation.usedBy = username;
    invitation.usedAt = new Date();
    await invitation.save();

    res.status(200).send({ 
      message: "User registered successfully with invitation code!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.verifyInvitation = async (req, res) => {
  try {
    const { invitationCode } = req.body;

    if (!invitationCode) {
      return res.status(400).send({ 
        valid: false,
        message: "Invitation code is required" 
      });
    }

    const invitation = await InvitationCode.findOne({ 
      code: invitationCode,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(200).send({ 
        valid: false,
        message: "Invalid or expired invitation code" 
      });
    }

    res.status(200).send({
      valid: true,
      message: "Invitation code is valid",
      username: invitation.username
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
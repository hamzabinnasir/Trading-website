// backend/app/controllers/auth.controller.js
const config = require("../config/auth.config");
const db = require("../mongodb-models");
const User = db.user;
const Role = db.role;
const Logs = db.logs;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.register = (req, res) => {
  console.log("📝 Register request:", req.body);
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    fundPassword: req.body.fundPassword ? bcrypt.hashSync(req.body.fundPassword, 8) : undefined,
    balance: 0,
    isOnline: false,
    gender: "Not Specified",
    signature: "New User",
    avatar: "",
    status: 'active'
  });

  user.save((err, user) => {
    if (err) {
      console.error("❌ Error saving user:", err);
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            console.error("❌ Error finding roles:", err);
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              console.error("❌ Error saving user with roles:", err);
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          console.error("❌ Error finding default role:", err);
          res.status(500).send({ message: err });
          return;
        }

        if (!role) {
          console.error("❌ Default 'user' role not found in DB!");
          res.status(500).send({ message: "Default role not found." });
          return;
        }

        user.roles = [role._id];
        user.save(err => {
          if (err) {
            console.error("❌ Error saving user with default role:", err);
            res.status(500).send({ message: err });
            return;
          }

          console.log("✅ User registered successfully:", user.username);
          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

exports.login = (req, res) => {
  User.findOne({
    username: req.body.username
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      // Check if user is frozen
      if (user.isFrozen) {
        return res.status(403).send({
          accessToken: null,
          message: "Account is frozen. Please contact support."
        });
      }

      // Check for pending verification (Access Request)
      if (user.status === 'pending_verification') {
        if (!req.body.invitationCode) {
          return res.status(401).send({
            accessToken: null,
            message: "Invitation Code Required",
            requiresInvitation: true
          });
        }

        if (req.body.invitationCode !== user.invitationCode) {
          return res.status(401).send({
            accessToken: null,
            message: "Invalid Invitation Code",
            requiresInvitation: true
          });
        }

        // Activate user
        user.status = 'active';
        // Save is handled below
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      // Set user online
      user.isOnline = true;
      user.save((err) => {
        if (err) {
          console.error("Error saving user status:", err);
        }
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token,
        balance: user.balance
      });
    });
};

// Validate token endpoint
exports.validateToken = (req, res) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      return res.status(500).send({ message: err });
    }

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({
      message: "Token is valid",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  });
};

// Get current user data
exports.getCurrentUser = (req, res) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      return res.status(500).send({ message: err });
    }

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      bitcoin: user.bitcoin,
      ethereum: user.ethereum,
      xrp: user.xrp,
      tether: user.tether,
      bitcoinCash: user.bitcoinCash,
      bitcoinSV: user.bitcoinSV,
      litecoin: user.litecoin,
      eos: user.eos,
      binancecoin: user.binancecoin,
      tezos: user.tezos,
      invitationCode: user.invitationCode || 'N/A'
    });
  });
};
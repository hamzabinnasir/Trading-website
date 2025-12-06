const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../mongodb-models");
const User = db.user;
const Role = db.role;

verifyToken = (req, res, next) => {
    let token = req.headers["x-access-token"];

    console.log("🔐 Auth Middleware - Token verification started");

    if (!token) {
        console.log("❌ No token provided!");
        return res.status(403).send({
            message: "No token provided!"
        });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            console.log("❌ Token verification failed:", err.message);
            return res.status(401).send({
                message: "Unauthorized!"
            });
        }

        console.log("✅ Token verified successfully");
        req.userId = decoded.id;

        // ✅ Check if user is online (Force Logout)
        User.findById(req.userId).exec((err, user) => {
            if (err) {
                console.error("❌ Database error during auth:", err);
                return res.status(500).send({ message: err });
            }
            if (!user) {
                console.log("❌ User not found during auth");
                return res.status(404).send({ message: "User not found" });
            }

            if (!user.isOnline) {
                console.log("❌ User is offline (Force Logout):", user.username);
                return res.status(401).send({
                    message: "Session expired. Please login again."
                });
            }

            next();
        });
    });
};

isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate("roles").exec();

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const isAdmin = user.roles.some(role => role.name === "admin");
        if (isAdmin) {
            next();
            return;
        }

        res.status(403).send({ message: "Require Admin Role!" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

isModerator = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate("roles").exec();

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const isModerator = user.roles.some(role => role.name === "moderator");
        if (isModerator) {
            next();
            return;
        }

        res.status(403).send({ message: "Require Moderator Role!" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

isAdminOrModerator = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).populate("roles").exec();

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const hasRole = user.roles.some(role =>
            role.name === "admin" || role.name === "moderator"
        );

        if (hasRole) {
            next();
            return;
        }

        res.status(403).send({ message: "Require Admin or Moderator Role!" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

isAdminCallback = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        User.populate(user, { path: 'roles' }, (err, populatedUser) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }

            const isAdmin = populatedUser.roles.some(role => role.name === "admin");
            if (isAdmin) {
                next();
                return;
            }

            res.status(403).send({ message: "Require Admin Role!" });
        });
    });
};

const authJwt = {
    verifyToken,
    isAdmin,
    isModerator,
    isAdminOrModerator,
    isAdminCallback
};
module.exports = authJwt;
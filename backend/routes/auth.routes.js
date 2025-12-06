// backend/routes/auth.routes.js - FIXED PATH
const { verifySignUp, authJwt } = require("../app/middlewares"); // ✅ CORRECT PATH
const authController = require("../app/controllers/auth.controller");
const invitationController = require("../app/controllers/invitation.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  // Existing routes
  app.post("/api/auth/register", authController.register);
  app.post("/api/auth/login", authController.login);

  // ✅ NEW AUTH VALIDATION ROUTES
  app.get("/api/auth/validate", [authJwt.verifyToken], authController.validateToken);
  app.get("/api/auth/me", [authJwt.verifyToken], authController.getCurrentUser);

  // Invitation routes
  app.post("/api/auth/register-with-invitation", invitationController.registerWithInvitation);
  app.post("/api/auth/verify-invitation", invitationController.verifyInvitation);
};
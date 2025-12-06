// backend/routes/profile.routes.js
const { authJwt } = require("../app/middlewares");
const profileController = require("../app/controllers/profile.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
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

  // ✅ ADD THESE BASIC ROUTES THAT YOUR FRONTEND EXPECTS
  app.get("/api/profile/", [authJwt.verifyToken], profileController.getProfile);
  app.put("/api/profile/wallet", [authJwt.verifyToken], profileController.updateWallet);
  
  // Keep your existing routes
  app.get("/api/profile/:username", [authJwt.verifyToken], profileController.getCompleteProfile);
  app.post("/api/profile/update", [authJwt.verifyToken], profileController.updateProfileInfo);
  
  // Password Management
  app.post("/api/profile/change-login-password", [authJwt.verifyToken], profileController.changeLoginPassword);
  app.post("/api/profile/change-fund-password", [authJwt.verifyToken], profileController.changeFundPassword);
  app.post("/api/profile/verify-fund-password", [authJwt.verifyToken], profileController.verifyFundPassword);
  
  // Site Messages
  app.get("/api/profile/messages/:username", [authJwt.verifyToken], profileController.getSiteMessages);
  app.put("/api/profile/messages/:messageId/read", [authJwt.verifyToken], profileController.markMessageAsRead);
};
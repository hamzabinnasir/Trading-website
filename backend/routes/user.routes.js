// backend/routes/user.routes.js
const { authJwt } = require("../app/middlewares");
const controller = require("../app/controllers/user.controller");

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

  // --- PUBLIC ROUTES ---
  app.get("/api/test/all", controller.allAccess);

  // --- AUTHENTICATED ROUTES ---
  
  // User Board
  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);
  
  // Balance & Portfolio Routes
  app.get("/api/user/balance", [authJwt.verifyToken], controller.getUserBalance);
  app.get("/api/user/value", [authJwt.verifyToken], controller.getUserValue);
  app.post("/api/user/update-balance", [authJwt.verifyToken], controller.updateBalance);
  app.get("/api/user/balance/:username", [authJwt.verifyToken], controller.getUserBalanceSimple);
  app.post("/api/user/update-user-balance", [authJwt.verifyToken], controller.updateUserBalance);

  // Profile Routes
  app.get("/api/user/profile", [authJwt.verifyToken], controller.getUserProfile);
  app.post("/api/user/update-profile", [authJwt.verifyToken], controller.updateProfile);

  // Wallet Routes
  app.post("/api/user/wallet/add", [authJwt.verifyToken], controller.addWallet);
  app.post("/api/user/wallet/update", [authJwt.verifyToken], controller.updateWallet);
  app.post("/api/user/wallet/delete", [authJwt.verifyToken], controller.deleteWallet);

  // Trading Routes (Legacy - for coin buy/sell)
  app.post("/api/user/buy", [authJwt.verifyToken, controller.verifyBalance], controller.buy);
  app.post("/api/user/sell", [authJwt.verifyToken, controller.verifyCoins], controller.sell);

  // --- MODERATOR & ADMIN ROUTES ---
  app.get("/api/test/mod", [authJwt.verifyToken, authJwt.isModerator], controller.moderatorBoard);
  app.get("/api/test/admin", [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);
};
// backend/routes/withdrawal.routes.js
const { authJwt } = require("../app/middlewares");
const withdrawalController = require("../app/controllers/withdrawal.controller");

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

  // User Routes
  app.post("/api/withdrawal/create", [authJwt.verifyToken], withdrawalController.createWithdrawal);
  app.get("/api/withdrawal/user/:username", [authJwt.verifyToken], withdrawalController.getUserWithdrawals);
  
  // Admin Routes
  app.get("/api/admin/withdrawals", [authJwt.verifyToken, authJwt.isAdmin], withdrawalController.getAllWithdrawals);
  app.post("/api/admin/withdrawal/approve", [authJwt.verifyToken, authJwt.isAdmin], withdrawalController.approveWithdrawal);
  app.post("/api/admin/withdrawal/reject", [authJwt.verifyToken, authJwt.isAdmin], withdrawalController.rejectWithdrawal);
};
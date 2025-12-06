// backend/routes/recharge.routes.js
const { authJwt } = require("../app/middlewares");
const rechargeController = require("../app/controllers/recharge.controller");

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
  app.post("/api/recharge/create", [authJwt.verifyToken], rechargeController.createRecharge);
  app.get("/api/recharge/user/:username", [authJwt.verifyToken], rechargeController.getUserRecharges);
  
  // Admin Routes
  app.get("/api/admin/recharges", [authJwt.verifyToken, authJwt.isAdmin], rechargeController.getAllRecharges);
  app.post("/api/admin/recharge/approve", [authJwt.verifyToken, authJwt.isAdmin], rechargeController.approveRecharge);
  app.post("/api/admin/recharge/reject", [authJwt.verifyToken, authJwt.isAdmin], rechargeController.rejectRecharge);
};
// backend/routes/admin.routes.js
const { authJwt } = require("../app/middlewares");
const adminController = require("../app/controllers/admin.controller");
const rechargeController = require("../app/controllers/recharge.controller");
const withdrawalController = require("../app/controllers/withdrawal.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
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

  // ✅ FIXED: Admin Authentication
  app.post("/api/admin/login", adminController.adminLogin);

  // ✅ FIXED: User Management Routes
  app.get("/api/admin/users", [authJwt.verifyToken, authJwt.isAdmin], adminController.getAllUsers);
  app.post("/api/admin/user/freeze", [authJwt.verifyToken, authJwt.isAdmin], adminController.toggleUserFreeze);
  app.post("/api/admin/user/offline", [authJwt.verifyToken, authJwt.isAdmin], adminController.setUserOffline);
  app.post("/api/admin/user/deduct", [authJwt.verifyToken, authJwt.isAdmin], adminController.deductFromUser);
  app.post("/api/admin/user/add", [authJwt.verifyToken, authJwt.isAdmin], adminController.addBalanceToUser); // ✅ ADDED
  app.post("/api/admin/user/message", [authJwt.verifyToken, authJwt.isAdmin], adminController.sendMessageToUser);

  // ✅ FIXED: Invitation Codes
  app.post("/api/admin/invitation/generate", [authJwt.verifyToken, authJwt.isAdmin], adminController.generateInvitationCode);
  app.get("/api/admin/invitation/codes", [authJwt.verifyToken, authJwt.isAdmin], adminController.getAllInvitationCodes);

  // ✅ FIXED: Dashboard
  app.get("/api/admin/dashboard", [authJwt.verifyToken, authJwt.isAdmin], adminController.getAdminDashboard);

  // ✅ ADDED: Recharge Management
  app.get("/api/admin/recharges", [authJwt.verifyToken, authJwt.isAdmin], rechargeController.getAllRecharges);
  app.post("/api/admin/recharge/approve", [authJwt.verifyToken, authJwt.isAdmin], rechargeController.approveRecharge);
  app.post("/api/admin/recharge/reject", [authJwt.verifyToken, authJwt.isAdmin], rechargeController.rejectRecharge);

  // ✅ ADDED: Withdrawal Management
  app.get("/api/admin/withdrawals", [authJwt.verifyToken, authJwt.isAdmin], withdrawalController.getAllWithdrawals);
  app.post("/api/admin/withdrawal/approve", [authJwt.verifyToken, authJwt.isAdmin], withdrawalController.approveWithdrawal);
  app.post("/api/admin/withdrawal/reject", [authJwt.verifyToken, authJwt.isAdmin], withdrawalController.rejectWithdrawal);
};
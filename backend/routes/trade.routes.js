// backend/routes/trade.routes.js
const { authJwt } = require("../app/middlewares");
const controller = require("../app/controllers/trade.controller");

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

  // Trade Routes
  app.post("/api/trade/create", [authJwt.verifyToken], controller.createTrade);
  app.get("/api/trade/user/:userId/:status", [authJwt.verifyToken], controller.getUserTrades);
  app.put("/api/trade/:tradeId/status", [authJwt.verifyToken], controller.updateTradeStatus);
  app.post("/api/trade/process-completed", [authJwt.verifyToken], controller.processCompletedTrades);
  app.get("/api/trade/time-options", [authJwt.verifyToken], controller.getTimeProfitOptions);
  app.put("/api/trade/:tradeId/balance-updated", [authJwt.verifyToken], controller.markTradeBalanceUpdated);
};
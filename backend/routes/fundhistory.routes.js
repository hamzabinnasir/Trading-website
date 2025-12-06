// backend/routes/fundhistory.routes.js
const { authJwt } = require("../app/middlewares");
const fundHistoryController = require("../app/controllers/fundhistory.controller");

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

  // User Routes (for asset page)
  app.get("/api/fundhistory/user/:username", [authJwt.verifyToken], fundHistoryController.getUserFundHistory);
  
  // Admin Routes
  app.get("/api/admin/fundhistory", [authJwt.verifyToken, authJwt.isAdmin], fundHistoryController.getAllFundHistory);
};
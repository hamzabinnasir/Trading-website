const controller = require("../app/controllers/accessRequest.controller");
const { authJwt } = require("../app/middlewares");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
        next();
    });

    app.post("/api/access-request", controller.submitRequest);
    app.get("/api/admin/access-requests", [authJwt.verifyToken, authJwt.isAdmin], controller.getAllRequests);
    app.patch("/api/admin/access-requests/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.updateRequestStatus);
};

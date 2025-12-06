const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.logs = require("./logs.model");
db.trade = require("./trade.model");
db.recharge = require("./recharge.model");
db.withdrawal = require("./withdrawal.model");
db.sitemessage = require("./sitemessage.model");
db.invitationcode = require("./invitationcode.model");
db.fundhistory = require("./fundhistory.model");
db.accessRequest = require("./accessRequest.model");

module.exports = db;
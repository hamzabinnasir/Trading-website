const db = require("../mongodb-models");
const FundHistory = db.fundhistory;

// Get user's fund history for asset page
exports.getUserFundHistory = async (req, res) => {
  try {
    const username = req.params.username;

    const fundHistory = await FundHistory.find({ username })
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).send(fundHistory);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all fund history (for admin)
exports.getAllFundHistory = async (req, res) => {
  try {
    const { username } = req.query;
    
    const query = {};
    if (username) {
      query.username = username;
    }

    const fundHistory = await FundHistory.find(query)
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).send(fundHistory);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
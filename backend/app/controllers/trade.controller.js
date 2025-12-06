// controllers/trade.controller.js

const Trade = require('../mongodb-models/trade.model');
const User = require('../mongodb-models/user.model');

// Time-Profit Matrix Configuration
const TIME_PROFIT_MATRIX = {
  30: 20,   // 30 seconds = 20% profit
  60: 30,   // 60 seconds = 30% profit
  120: 40,  // 120 seconds = 40% profit
  180: 50,  // 180 seconds = 50% profit
  240: 60   // 240 seconds = 60% profit
};

// Function to automatically process completed trades
exports.autoProcessCompletedTrades = async () => {
  try {
    const now = new Date();
    const pendingTrades = await Trade.find({ 
      status: 'Pending', 
      endTime: { $lte: now } 
    });

    console.log(`Found ${pendingTrades.length} trades to process`);

    for (const trade of pendingTrades) {
      try {
        // Update user balance with payout
        const user = await User.findById(trade.userId);
        if (user) {
          user.balance += trade.result_payout;
          await user.save();
          console.log(`Added $${trade.result_payout} to user ${user.username}'s balance. New balance: $${user.balance}`);
        }

        // Update trade status to Closed and mark as balance updated
        trade.status = 'Closed';
        trade.balanceUpdated = true;
        await trade.save();
        console.log(`Trade ${trade.orderNo} completed and closed`);
        
      } catch (tradeError) {
        console.error(`Error processing trade ${trade.orderNo}:`, tradeError);
      }
    }

    return { processed: pendingTrades.length };
  } catch (error) {
    console.error("Error in autoProcessCompletedTrades:", error);
    throw error;
  }
};

exports.createTrade = async (req, res) => {
  try {
    console.log("Received trade data:", req.body);
    
    const {
      userId,
      currency,
      orderAmount,
      direction,
      billingTime  // This should be the time in seconds (30, 60, 120, 180, 240)
    } = req.body;

    // Validate required fields
    if (!userId || !currency || !orderAmount || !direction || !billingTime) {
      return res.status(400).json({ 
        message: "Missing required fields: userId, currency, orderAmount, direction, billingTime" 
      });
    }

    // Check if user exists and has sufficient balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    if (user.balance < orderAmount) {
      return res.status(400).json({ 
        message: "Insufficient balance" 
      });
    }

    // Validate billing time
    const billingSeconds = parseInt(billingTime);
    if (!TIME_PROFIT_MATRIX.hasOwnProperty(billingSeconds)) {
      return res.status(400).send({ 
        message: "Invalid billing time. Must be 30, 60, 120, 180, or 240 seconds." 
      });
    }

    // Calculate profit based on time-profit matrix
    const profitPercentage = TIME_PROFIT_MATRIX[billingSeconds];
    const profitAmount = orderAmount * (profitPercentage / 100);
    const result_payout = orderAmount + profitAmount;

    const orderNo = "B" + Date.now();
    const orderTime = new Date();
    const endTime = new Date(orderTime.getTime() + (billingSeconds * 1000));

    // Create new trade
    const trade = new Trade({
      userId,
      currency,
      orderNo,
      orderAmount,
      profitAmount,
      direction,
      scale: profitPercentage + "%",
      billingTime: billingTime + "s",
      orderTime,
      endTime,
      result_payout,
      status: 'Pending',
      balanceUpdated: false
    });

    // Save trade to database
    await trade.save();

    // Deduct amount from user balance
    user.balance -= orderAmount;
    await user.save();

    console.log("Trade created successfully:", trade);
    console.log(`User ${user.username} balance updated: $${user.balance}`);

    res.status(201).json({
      message: "Trade created successfully!",
      trade: {
        ...trade._doc,
        profitPercentage: profitPercentage
      }
    });

  } catch (error) {
    console.error("Trade creation error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

exports.getUserTrades = async (req, res) => {
  try {
    const { userId, status } = req.params;
    
    const query = { userId };
    if (status !== 'all') {
      query.status = status;
    }

    const trades = await Trade.find(query).sort({ orderTime: -1 });
    res.status(200).send(trades);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateTradeStatus = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { status } = req.body;

    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return res.status(404).send({ message: "Trade not found" });
    }

    trade.status = status;
    await trade.save();

    res.status(200).send({ message: "Trade status updated successfully!", trade });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Function to process completed trades manually
exports.processCompletedTrades = async (req, res) => {
  try {
    const result = await this.autoProcessCompletedTrades();
    
    res.status(200).send({ 
      message: `Processed ${result.processed} completed trades`,
      processed: result.processed 
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Helper function to get time-profit options
exports.getTimeProfitOptions = async (req, res) => {
  try {
    const options = Object.entries(TIME_PROFIT_MATRIX).map(([time, profit]) => ({
      time: parseInt(time),
      profit: profit
    }));
    
    res.status(200).send(options);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Mark trade as balance updated (to prevent duplicate processing)
exports.markTradeBalanceUpdated = async (req, res) => {
  try {
    const { tradeId } = req.params;

    const trade = await Trade.findByIdAndUpdate(
      tradeId,
      { 
        balanceUpdated: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    res.status(200).json({
      message: "Trade marked as balance updated",
      trade
    });
  } catch (error) {
    console.error("Error marking trade balance updated:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
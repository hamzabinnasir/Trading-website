const Trade = require('../mongodb-models/trade.model');
const User = require('../mongodb-models/user.model');

class TradeProcessor {
  constructor() {
    this.isProcessing = false;
    this.intervalId = null;
  }

  async processCompletedTrades() {
    if (this.isProcessing) {
      console.log('Trade processor is already running, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      const now = new Date();
      const pendingTrades = await Trade.find({ 
        status: 'Pending', 
        endTime: { $lte: now } 
      });

      console.log(`Trade Processor: Found ${pendingTrades.length} trades to process`);

      for (const trade of pendingTrades) {
        try {
          // Update user balance with payout
          const user = await User.findById(trade.userId);
          if (user) {
            user.balance += trade.result_payout;
            await user.save();
            console.log(`Trade Processor: Added $${trade.result_payout} to user ${user.username}'s balance. New balance: $${user.balance}`);
          }

          // Update trade status to Closed
          trade.status = 'Closed';
          await trade.save();
          console.log(`Trade Processor: Trade ${trade.orderNo} completed and closed`);
          
        } catch (tradeError) {
          console.error(`Trade Processor: Error processing trade ${trade.orderNo}:`, tradeError);
        }
      }

      console.log(`Trade Processor: Completed processing ${pendingTrades.length} trades`);
    } catch (error) {
      console.error('Trade Processor: Error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  start() {
    // Process trades every 3 seconds for real-time updates
    this.intervalId = setInterval(() => {
      this.processCompletedTrades();
    }, 30000);

    console.log('Trade Processor started - checking every 3 seconds');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Trade Processor stopped');
    }
  }
}

module.exports = new TradeProcessor();
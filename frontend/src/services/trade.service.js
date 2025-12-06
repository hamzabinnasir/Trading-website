// src/services/trade.service.js

import axios from 'axios';
import authHeader from './auth-header';

const API_BASE_URL = 'http://localhost:8080/api/';

class TradeService {
  // Create new trade
  createTrade(tradeData) {
    return axios.post(API_BASE_URL + 'trade/create', tradeData, {
      headers: authHeader()
    });
  }

  // Get user trades with status
  getUserTrades(userId, status = 'all') {
    return axios.get(API_BASE_URL + `trade/user/${userId}/${status}`, {
      headers: authHeader()
    });
  }

  // Update trade status
  updateTradeStatus(tradeId, status) {
    return axios.put(API_BASE_URL + `trade/${tradeId}/status`, {
      status: status
    }, {
      headers: authHeader()
    });
  }

  // Mark trade as balance updated
  markTradeBalanceUpdated(tradeId) {
    return axios.put(API_BASE_URL + `trade/${tradeId}/balance-updated`, {}, {
      headers: authHeader()
    });
  }

  // Process completed trades
  processCompletedTrades() {
    return axios.post(API_BASE_URL + 'trade/process-completed', {}, {
      headers: authHeader()
    });
  }

  // Get time profit options
  getTimeProfitOptions() {
    return axios.get(API_BASE_URL + 'trade/time-options', {
      headers: authHeader()
    });
  }

  // Additional methods for different status
  getPendingTrades(userId) {
    return this.getUserTrades(userId, 'pending');
  }

  getCompletedTrades(userId) {
    return this.getUserTrades(userId, 'completed');
  }
}

export default new TradeService();
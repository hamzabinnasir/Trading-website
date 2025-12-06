import axios from 'axios';
import authHeader from './auth-header';

const API_BASE_URL = 'http://localhost:8080/api/withdrawal/';

class WithdrawalService {
  // Create withdrawal request
  createWithdrawal(amount, walletType, walletDetails, fundPassword) {
    return axios.post(`${API_BASE_URL}create`, {
      amount,
      walletType,
      walletDetails,
      fundPassword
    }, {
      headers: authHeader()
    });
  }

  // Get user's withdrawal history
  getUserWithdrawals() {
    const user = JSON.parse(localStorage.getItem('user'));
    const username = user ? user.username : '';
    return axios.get(`${API_BASE_URL}user/${username}`, {
      headers: authHeader()
    });
  }

  // Admin: Get all withdrawal requests
  getAllWithdrawals() {
    return axios.get(`http://localhost:8080/api/admin/withdrawals`, {
      headers: authHeader()
    });
  }

  // Admin: Approve withdrawal
  approveWithdrawal(withdrawalId) {
    return axios.post(`http://localhost:8080/api/admin/withdrawal/approve`, { withdrawalId }, {
      headers: authHeader()
    });
  }

  // Admin: Reject withdrawal
  rejectWithdrawal(withdrawalId) {
    return axios.post(`http://localhost:8080/api/admin/withdrawal/reject`, { withdrawalId }, {
      headers: authHeader()
    });
  }
}

export default new WithdrawalService();
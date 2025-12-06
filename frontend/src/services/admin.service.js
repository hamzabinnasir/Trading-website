import axios from 'axios';
import authHeader from './auth-header';

const API_BASE_URL = 'http://localhost:8080/api/admin/';

class AdminService {

  // ✅ FIXED: Get all users
  getAllUsers() {
    console.log('🔄 Fetching all users...');
    return axios.get(API_BASE_URL + 'users', {
      headers: authHeader()
    });
  }

  // ✅ FIXED: Freeze/unfreeze user
  toggleUserFreeze(userId) {
    console.log('🔄 Toggling user freeze:', userId);
    return axios.post(API_BASE_URL + 'user/freeze',
      { userId },
      { headers: authHeader() }
    );
  }

  // ✅ FIXED: Set user offline
  setUserOffline(userId) {
    console.log('🔄 Setting user offline:', userId);
    return axios.post(API_BASE_URL + 'user/offline',
      { userId },
      { headers: authHeader() }
    );
  }

  // ✅ FIXED: Deduct from user balance
  deductFromUser(userId, amount, reason) {
    console.log('🔄 Deducting from user:', userId, 'Amount:', amount);
    return axios.post(API_BASE_URL + 'user/deduct',
      { userId, amount, reason },
      { headers: authHeader() }
    );
  }

  // ✅ ADDED: Add to user balance
  addToUser(userId, amount, reason) {
    console.log('🔄 Adding to user:', userId, 'Amount:', amount);
    return axios.post(API_BASE_URL + 'user/add',
      { userId, amount, reason },
      { headers: authHeader() }
    );
  }

  // ✅ FIXED: Send message to user
  sendMessageToUser(userId, title, message) {
    console.log('🔄 Sending message to user:', userId);
    return axios.post(API_BASE_URL + 'user/message',
      { userId, title, message },
      { headers: authHeader() }
    );
  }

  // ✅ FIXED: Generate invitation code
  generateInvitationCode(username, password) {
    return axios.post(API_BASE_URL + 'invitation/generate',
      { username, password },
      { headers: authHeader() }
    );
  }

  // ✅ FIXED: Get all invitation codes
  getAllInvitationCodes() {
    return axios.get(API_BASE_URL + 'invitation/codes', {
      headers: authHeader()
    });
  }

  // ✅ FIXED: Get admin dashboard stats
  getAdminDashboard() {
    console.log('🔄 Fetching admin dashboard...');
    return axios.get(API_BASE_URL + 'dashboard', {
      headers: authHeader()
    });
  }

  // --- RECHARGE MANAGEMENT ---
  getAllRecharges(status = 'all') {
    return axios.get(API_BASE_URL + `recharges?status=${status}`, { headers: authHeader() });
  }

  approveRecharge(rechargeId, note = '') {
    return axios.post(API_BASE_URL + 'recharge/approve',
      { rechargeId, adminUsername: 'admin', note }, // You might want to get actual admin username
      { headers: authHeader() }
    );
  }

  rejectRecharge(rechargeId, note = '') {
    return axios.post(API_BASE_URL + 'recharge/reject',
      { rechargeId, adminUsername: 'admin', note },
      { headers: authHeader() }
    );
  }

  // --- WITHDRAWAL MANAGEMENT ---
  getAllWithdrawals(status = 'all') {
    return axios.get(API_BASE_URL + `withdrawals?status=${status}`, { headers: authHeader() });
  }

  approveWithdrawal(withdrawalId, note = '') {
    return axios.post(API_BASE_URL + 'withdrawal/approve',
      { withdrawalId, adminUsername: 'admin', note },
      { headers: authHeader() }
    );
  }

  rejectWithdrawal(withdrawalId, note = '') {
    return axios.post(API_BASE_URL + 'withdrawal/reject',
      { withdrawalId, adminUsername: 'admin', note },
      { headers: authHeader() }
    );
  }
}

export default new AdminService();
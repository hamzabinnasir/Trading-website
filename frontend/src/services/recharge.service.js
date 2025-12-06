import axios from 'axios';
import authHeader from './auth-header';

const API_BASE_URL = 'http://localhost:8080/api/recharge';

class RechargeService {
  // Create recharge request
  createRecharge(amount, channel = 'Channel 01') {
    return axios.post(`${API_BASE_URL}/create`, {
      amount,
      channel
    }, {
      headers: authHeader()
    });
  }

  // Get user's recharge history
  getUserRecharges() {
    const user = JSON.parse(localStorage.getItem('user'));
    const username = user ? user.username : '';
    return axios.get(`${API_BASE_URL}/user/${username}`, {
      headers: authHeader()
    });
  }

  // Admin: Get all recharge requests
  getAllRecharges() {
    return axios.get(`http://localhost:8080/api/admin/recharges`, {
      headers: authHeader()
    });
  }

  // Admin: Approve recharge
  approveRecharge(rechargeId) {
    return axios.post(`http://localhost:8080/api/admin/recharge/approve`, { rechargeId }, {
      headers: authHeader()
    });
  }

  // Admin: Reject recharge
  rejectRecharge(rechargeId) {
    return axios.post(`http://localhost:8080/api/admin/recharge/reject`, { rechargeId }, {
      headers: authHeader()
    });
  }

  // Admin: Delete recharge (extra useful)
  deleteRecharge(rechargeId) {
    return axios.delete(`${API_BASE_URL}/admin/delete/${rechargeId}`, {
      headers: authHeader()
    });
  }
}

export default new RechargeService();

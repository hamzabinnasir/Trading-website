// src/services/user.service.js
import axios from 'axios';
import authHeader from './auth-header';

const API_BASE_URL = 'http://localhost:8080/api/user/';

class UserService {
  getPublicContent() {
    return axios.get(API_BASE_URL + 'test/all');
  }

  getUserBoard() {
    return axios.get(API_BASE_URL + 'test/user', { headers: authHeader() });
  }

  // ✅ FIXED: Remove username parameter - backend gets user from token
  getUserBalance() {
    return axios.get(API_BASE_URL + "balance", {
      headers: authHeader()
    });
  }

  // ✅ FIXED: Remove username parameter
  updateBalance(newBalance) {
    return axios.post(API_BASE_URL + "update-balance", {
      newBalance: parseFloat(newBalance)
    }, {
      headers: authHeader()
    });
  }

  // Get user profile data
  getUserProfile() {
    return axios.get(API_BASE_URL + 'profile', {
      headers: authHeader()
    });
  }

  // Update user profile
  updateProfile(profileData) {
    return axios.post(API_BASE_URL + 'update-profile', profileData, {
      headers: authHeader()
    });
  }

  // Legacy trading routes
  buy(coin, value) {
    return axios.post(API_BASE_URL + 'buy', {
      coin,
      value
    }, {
      headers: authHeader()
    });
  }

  sell(coin, value) {
    return axios.post(API_BASE_URL + 'sell', {
      coin,
      value
    }, {
      headers: authHeader()
    });
  }

  // Get current user from localStorage
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }
}

export default new UserService();
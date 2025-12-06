import axios from 'axios';
import authHeader from './auth-header';

const API_BASE_URL = 'http://localhost:8080/api/profile/';

class ProfileService {
  // Get user profile
  getProfile() {
    return axios.get(API_BASE_URL, {
      headers: authHeader()
    });
  }

  // Update profile information
  updateProfile(profileData) {
    return axios.put(API_BASE_URL, profileData, {
      headers: authHeader()
    });
  }

  // Update wallet information
  updateWallet(walletData) {
    return axios.put(API_BASE_URL + 'wallet', walletData, {
      headers: authHeader()
    });
  }

  // Change login password
  changeLoginPassword(currentPassword, newPassword) {
    return axios.put(API_BASE_URL + 'security', {
      currentPassword,
      newPassword
    }, {
      headers: authHeader()
    });
  }

  // Change fund password
  changeFundPassword(currentFundPassword, newFundPassword) {
    return axios.put(API_BASE_URL + 'security/fund', {
      currentFundPassword,
      newFundPassword
    }, {
      headers: authHeader()
    });
  }

  // Verify fund password
  verifyFundPassword(fundPassword) {
    return axios.post(API_BASE_URL + 'verify-fund-password', {
      fundPassword
    }, {
      headers: authHeader()
    });
  }

  // Get user's site messages
  getSiteMessages() {
    return axios.get(API_BASE_URL + 'messages', {
      headers: authHeader()
    });
  }

  // Mark message as read
  markMessageAsRead(messageId) {
    return axios.put(API_BASE_URL + `messages/${messageId}/read`, {}, {
      headers: authHeader()
    });
  }
}

export default new ProfileService();
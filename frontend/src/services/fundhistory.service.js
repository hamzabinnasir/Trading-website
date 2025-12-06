import axios from 'axios';
import authHeader from './auth-header';

const API_BASE_URL = 'https://trading-website-tan.vercel.app/api/fundhistory';

class FundHistoryService {
  // Get user's fund history
  getUserFundHistory() {
    return axios.get(`${API_BASE_URL}/`, {
      headers: authHeader()
    });
  }

  // Admin: Get all fund history
  getAllFundHistory() {
    return axios.get(`${API_BASE_URL}/admin/all`, {
      headers: authHeader()
    });
  }

  // Admin: Add new fund record (optional)
  createFundRecord(data) {
    return axios.post(`${API_BASE_URL}/admin/create`, data, {
      headers: authHeader()
    });
  }

  // Admin: Delete fund record
  deleteFundRecord(id) {
    return axios.delete(`${API_BASE_URL}/admin/delete/${id}`, {
      headers: authHeader()
    });
  }
}

export default new FundHistoryService();

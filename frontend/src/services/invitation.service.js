import axios from 'axios';

const API_BASE_URL = 'https://trading-website-tan.vercel.app/api/auth/';

class InvitationService {
  // Register with invitation code
  registerWithInvitation(username, email, password, fundPassword, invitationCode) {
    return axios.post(API_BASE_URL + 'register', {
      username,
      email,
      password,
      fundPassword,
      invitationCode
    });
  }

  // Verify invitation code
  verifyInvitation(invitationCode) {
    return axios.post(API_BASE_URL + 'verify-invitation', {
      invitationCode
    });
  }
}

export default new InvitationService();
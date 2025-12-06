// src/services/auth.service.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8080/api/auth/";

class AuthService {
  async login(username, password, invitationCode) {
    try {
      const response = await axios.post(API_URL + "login", {
        username,
        password,
        invitationCode
      });

      console.log("🔑 Login Response:", response.data);

      const token = response.data.accessToken || response.data.token;

      if (token) {
        // Clear potential admin session to avoid conflict
        localStorage.removeItem("adminUser");

        // Store user details directly
        const userData = {
          ...response.data,
          isAdmin: false
        };
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("✅ Regular user stored:", userData.username);
      }

      return response.data;
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  }

  // ✅ FIXED: Admin login method
  async adminLogin(username, password) {
    try {
      const response = await axios.post("http://127.0.0.1:8080/api/admin/login", {
        username,
        password,
      });

      console.log("🔑 Admin Login Response:", response.data);

      const token = response.data.accessToken || response.data.token;

      if (token) {
        // Clear potential regular user session
        localStorage.removeItem("user");

        // Store admin details directly
        const adminData = {
          ...response.data,
          isAdmin: true
        };
        localStorage.setItem("adminUser", JSON.stringify(adminData));
        console.log("✅ Admin user stored:", adminData.username);
      }

      return response.data;
    } catch (error) {
      console.error("❌ Admin login failed:", error);
      throw error;
    }
  }

  logout() {
    console.log("🚪 Logging out - clearing all data");
    localStorage.removeItem("user");
    localStorage.removeItem("adminUser");
    sessionStorage.clear();
  }

  register(username, email, password, fundPassword, invitationCode) {
    return axios.post(API_URL + "register", {
      username,
      email,
      password,
      fundPassword,
      invitationCode
    });
  }

  // ✅ SIMPLIFIED: Get Current User directly from LocalStorage
  getCurrentUser() {
    try {
      // Check for admin first
      const adminUser = localStorage.getItem("adminUser");
      if (adminUser) return JSON.parse(adminUser);

      // Then check for regular user
      const user = localStorage.getItem("user");
      if (user) return JSON.parse(user);

      return null;
    } catch (e) {
      return null;
    }
  }

  // ✅ Check if current user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.roles && user.roles.includes("admin");
  }
}

export default new AuthService();
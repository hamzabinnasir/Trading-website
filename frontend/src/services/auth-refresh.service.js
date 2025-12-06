// src/services/auth-refresh.service.js

import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://localhost:8080/api/auth/';

class AuthRefreshService {

  // ✅ Validate and refresh user session
  async validateAndRefreshSession() {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser || !currentUser.accessToken) {
        console.log("❌ No user session found");
        return null;
      }

      console.log("🔄 Validating current user session...");

      // Verify token is still valid by making a test API call
      const response = await axios.get(API_URL + 'me', {
        headers: authHeader()
      });

      console.log("✅ Session validation successful");
      return response.data;

    } catch (error) {
      console.error("❌ Session validation failed:", error);

      // If validation fails, clear corrupted data
      this.clearSession();
      return null;
    }
  }

  // ✅ Force refresh user data from backend
  async refreshUserData() {
    try {
      const currentUser = this.getCurrentUser();

      if (!currentUser || !currentUser.accessToken) {
        console.log("❌ No user to refresh");
        return null;
      }

      console.log("🔄 Refreshing user data from server...");

      // Get fresh user data from backend
      const response = await axios.get(API_URL + 'me', {
        headers: authHeader()
      });

      if (response.data) {
        // Update localStorage with fresh data
        const updatedUser = {
          ...currentUser,
          ...response.data,
          id: response.data.id || response.data._id, // Ensure correct ID
          accessToken: currentUser.accessToken // Keep the original token
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log("✅ User data refreshed successfully:", updatedUser.username);
        return updatedUser;
      }

    } catch (error) {
      console.error("❌ User data refresh failed:", error);

      // Don't clear session immediately on refresh failure
      // Let the calling component handle it
      return null;
    }
  }

  // ✅ Clear all session data (COMPREHENSIVE)
  clearSession() {
    console.log("🧹 Clearing all session data");

    // Clear all possible storage keys
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    localStorage.removeItem('adminUser');

    sessionStorage.clear();

    // Clear any service worker caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    console.log("✅ All session data cleared");
  }

  // ✅ Get current user with validation (SUPPORTS BOTH USER AND ADMIN)
  getCurrentUser() {
    try {
      // Check regular user first
      let userStr = localStorage.getItem('user');
      let userType = 'user';

      // If no regular user, check admin
      if (!userStr) {
        userStr = localStorage.getItem('admin');
        userType = 'admin';
      }

      // If no admin, check adminUser (legacy)
      if (!userStr) {
        userStr = localStorage.getItem('adminUser');
        userType = 'admin';
      }

      if (!userStr) {
        return null;
      }

      const user = JSON.parse(userStr);

      // Basic validation
      if (!user.accessToken) {
        console.warn("⚠️ Invalid user data in storage - missing accessToken");
        this.clearSession();
        return null;
      }

      // Add user type for identification
      user.userType = userType;
      user.isAdmin = userType === 'admin' || user.roles?.some(role => role.name === 'admin');

      return user;
    } catch (error) {
      console.error("❌ Error reading user data:", error);
      this.clearSession();
      return null;
    }
  }

  // ✅ Check if user is authenticated
  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!(user && user.accessToken);
  }

  // ✅ NEW: Check if current user is admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.isAdmin || user.roles?.some(role => role.name === 'admin'));
  }

  // ✅ NEW: Get user type
  getUserType() {
    const user = this.getCurrentUser();
    if (!user) return null;

    if (user.isAdmin || user.roles?.some(role => role.name === 'admin')) {
      return 'admin';
    }
    return 'user';
  }

  // ✅ NEW: Clear specific user type
  clearUserType(userType) {
    console.log(`🧹 Clearing ${userType} data`);

    if (userType === 'admin') {
      localStorage.removeItem('admin');
      localStorage.removeItem('adminUser');
    } else if (userType === 'user') {
      localStorage.removeItem('user');
    }
  }

  // ✅ NEW: Verify user session on app start
  async initializeSession() {
    console.log("🔍 Initializing user session...");

    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      console.log("❌ No user session found");
      return null;
    }

    try {
      // Validate the session
      const validatedUser = await this.validateAndRefreshSession();

      if (validatedUser) {
        console.log("✅ Session initialized successfully");
        return validatedUser;
      } else {
        console.log("❌ Session initialization failed");
        return null;
      }
    } catch (error) {
      console.error("❌ Session initialization error:", error);
      return null;
    }
  }
}

export default new AuthRefreshService();
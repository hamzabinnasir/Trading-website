// services/auth-header.js

export default function authHeader() {
  try {
    console.log("🔍 auth-header: Checking tokens...");
    
    // Check ALL possible storage locations
    const keysToCheck = ['admin', 'adminUser', 'user'];
    
    for (const key of keysToCheck) {
      const itemStr = localStorage.getItem(key);
      if (itemStr) {
        const item = JSON.parse(itemStr);
        if (item && item.accessToken) {
          console.log(`✅ Using token from "${key}" key`);
          return { 
            'x-access-token': item.accessToken,
            'Content-Type': 'application/json'
          };
        }
      }
    }
    
    console.log('❌ No valid token found in any storage location');
    console.log('Available localStorage keys:', Object.keys(localStorage));
    
    return { 'Content-Type': 'application/json' };
    
  } catch (error) {
    console.error('❌ Error in authHeader:', error);
    return { 'Content-Type': 'application/json' };
  }
}
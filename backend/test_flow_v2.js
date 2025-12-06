const axios = require('axios');

const API_URL = "http://localhost:8080/api";
const AUTH_URL = "http://localhost:8080/api/auth";
const ADMIN_URL = "http://localhost:8080/api/admin";

async function testFlow() {
    try {
        const username = "testuser" + Math.floor(Math.random() * 1000);
        const email = `test${Math.floor(Math.random() * 1000)}@example.com`;
        const password = "password123";

        console.log(`🚀 Starting test flow v2 for user: ${username} (${email})`);

        // 1. Submit Registration Request (Simulating Register.js submit)
        console.log("1️⃣ Submitting registration request...");
        try {
            // Note: Register.js sends username, email, password, fundPassword. No invitationCode.
            const regRes = await axios.post(`${AUTH_URL}/register`, {
                username,
                email,
                password,
                fundPassword: "fundpassword123"
            });
            console.log("✅ Registration response:", regRes.data);
        } catch (e) {
            console.error("❌ Registration failed:", e.response ? e.response.data : e.message);
            return;
        }

        // 2. Login as Admin
        console.log("2️⃣ Logging in as Admin...");
        let adminToken;
        try {
            const adminRes = await axios.post(`${ADMIN_URL}/login`, {
                username: "admin",
                password: "admin123"
            });
            adminToken = adminRes.data.accessToken;
            console.log("✅ Admin logged in.");
        } catch (e) {
            console.error("❌ Admin login failed:", e.response ? e.response.data : e.message);
            return;
        }

        // 3. Get Pending Requests
        console.log("3️⃣ Fetching pending requests...");
        let requestId;
        try {
            const requestsRes = await axios.get(`${ADMIN_URL}/access-requests`, {
                headers: { "x-access-token": adminToken }
            });
            const request = requestsRes.data.find(r => r.email === email);
            if (!request) {
                console.error("❌ Request not found in list.");
                return;
            }
            requestId = request._id;
            console.log("✅ Found request ID:", requestId);
        } catch (e) {
            console.error("❌ Fetch requests failed:", e.response ? e.response.data : e.message);
            return;
        }

        // 4. Approve Request
        console.log("4️⃣ Approving request...");
        let invitationCode;
        try {
            const approveRes = await axios.patch(`${ADMIN_URL}/access-requests/${requestId}`, {
                status: "accepted"
            }, {
                headers: { "x-access-token": adminToken }
            });
            console.log("✅ Approval response:", approveRes.data);
            invitationCode = approveRes.data.invitationCode;
            console.log("🔑 Invitation Code:", invitationCode);
        } catch (e) {
            console.error("❌ Approval failed:", e.response ? e.response.data : e.message);
            return;
        }

        // 5. Login as User (With code)
        console.log("5️⃣ Logging in as User (with code)...");
        try {
            const loginRes = await axios.post(`${AUTH_URL}/login`, {
                username,
                password,
                invitationCode
            });
            console.log("✅ Login successful!", loginRes.data);
        } catch (e) {
            console.error("❌ Login with code failed:", e.response ? e.response.data : e.message);
        }

    } catch (error) {
        console.error("❌ Test flow error:", error);
    }
}

testFlow();

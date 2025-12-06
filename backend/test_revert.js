const axios = require('axios');

const API_URL = "http://localhost:8080/api";
const AUTH_URL = "http://localhost:8080/api/auth";

async function testRevertFlow() {
    try {
        const username = "revertuser" + Math.floor(Math.random() * 1000);
        const email = `revert${Math.floor(Math.random() * 1000)}@example.com`;
        const password = "password123";

        console.log(`🚀 Starting Revert Flow Test for user: ${username} (${email})`);

        // 1. Register (Should create user directly, no access request)
        console.log("1️⃣ Registering user...");
        try {
            const regRes = await axios.post(`${AUTH_URL}/register`, {
                username,
                email,
                password,
                fundPassword: "fundpassword123"
            });
            console.log("✅ Registration response:", regRes.data);
            if (regRes.data.message !== "User was registered successfully!") {
                console.error("❌ Unexpected registration message:", regRes.data.message);
                return;
            }
        } catch (e) {
            console.error("❌ Registration failed:", e.response ? e.response.data : e.message);
            return;
        }

        // 2. Login (Should work immediately without code)
        console.log("2️⃣ Logging in...");
        try {
            const loginRes = await axios.post(`${AUTH_URL}/login`, {
                username,
                password
            });
            console.log("✅ Login successful!", loginRes.data);
            if (!loginRes.data.accessToken) {
                console.error("❌ No access token received!");
            }
        } catch (e) {
            console.error("❌ Login failed:", e.response ? e.response.data : e.message);
        }

    } catch (error) {
        console.error("❌ Test flow error:", error);
    }
}

testRevertFlow();

const db = require("../mongodb-models");
const AccessRequest = db.accessRequest;
const User = db.user;
const Role = db.role;
const bcrypt = require("bcryptjs");

exports.submitRequest = async (req, res) => {
    try {
        const { name, username, email, password, fundPassword, reason } = req.body;

        // Check if request already exists
        const existingRequest = await AccessRequest.findOne({ email, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: "A pending request already exists for this email." });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        const request = new AccessRequest({
            name,
            username,
            email,
            password: bcrypt.hashSync(password, 8),
            fundPassword: bcrypt.hashSync(fundPassword, 8),
            reason,
            requestType: 'registration'
        });

        await request.save();
        res.json({ message: "Request submitted successfully. Please wait for admin approval." });
    } catch (error) {
        console.error("Submit request error:", error);
        res.status(500).json({ message: "Failed to submit request." });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await AccessRequest.find().sort({ requestedAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error("Get requests error:", error);
        res.status(500).json({ message: "Failed to fetch requests." });
    }
};

exports.updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const request = await AccessRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        request.status = status;
        await request.save();

        let invitationCode = null;

        if (status === 'accepted') {
            // Create User Account
            const userRole = await Role.findOne({ name: "user" });

            // Check if user already exists (double check)
            const userExists = await User.findOne({ email: request.email });
            if (!userExists) {
                // Generate random 6-digit invitation code
                invitationCode = Math.floor(100000 + Math.random() * 900000).toString();

                const newUser = new User({
                    username: request.username || request.name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
                    email: request.email,
                    password: request.password, // Already hashed
                    fundPassword: request.fundPassword, // Already hashed
                    roles: [userRole._id],
                    balance: 0,
                    isOnline: false,
                    gender: "Not Specified",
                    signature: "New User",
                    avatar: "",
                    status: 'pending_verification', // Set status to pending_verification
                    invitationCode: invitationCode // Save invitation code
                });

                await newUser.save();

                // Mock Email Sending
                console.log("==================================================");
                console.log(`📧 [MOCK EMAIL] Sending Invitation Code to ${request.email}`);
                console.log(`🔑 Invitation Code: ${invitationCode}`);
                console.log("==================================================");
            }
        }

        res.json({
            message: `Request ${status} successfully.`,
            invitationCode: invitationCode // Return code to admin (optional, for debugging)
        });
    } catch (error) {
        console.error("Update request error:", error);
        res.status(500).json({ message: "Failed to update request." });
    }
};

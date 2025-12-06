// backend/app.js - CLEAN VERSION WITH DEBUG LOGS
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Fix Mongoose deprecation warning
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// database connection
const db = require("./app/mongodb-models");

// ✅ UPDATED: MongoDB Atlas Connection with proper error handling
db.mongoose
    .connect(dbConfig.ATLAS_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    })
    .then(() => {
        console.log("✅ Successfully connected to MongoDB Atlas!");
        console.log(`📊 Database: papertrade_db`);
        console.log(`🌐 Cluster: cluster0.bseqdm5.mongodb.net`);

        // Initialize database AFTER successful connection
        return Promise.all([
            initializeRoles(),
            initializeAdminUser()
        ]);
    })
    .catch(err => {
        console.error("❌ MongoDB Atlas connection error:", err.message);
        console.log("Please check:");
        console.log("1. MongoDB Atlas Network Access (whitelist your IP)");
        console.log("2. Database user credentials");
        console.log("3. Internet connection");
        // process.exit(1); // Allow server to start even if DB fails (for debugging)
    });

// ✅ ADDITIONAL CORS HEADERS FOR PREFLIGHT REQUESTS
app.use(function (req, res, next) {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// ✅ DATABASE INITIALIZATION FUNCTIONS
const initializeRoles = async () => {
    try {
        const Role = db.role;
        const count = await Role.estimatedDocumentCount();

        if (count === 0) {
            await new Role({ name: "user" }).save();
            console.log("✅ Added 'user' to roles collection");

            await new Role({ name: "moderator" }).save();
            console.log("✅ Added 'moderator' to roles collection");

            await new Role({ name: "admin" }).save();
            console.log("✅ Added 'admin' to roles collection");

            console.log("🎯 Roles initialized successfully");
        } else {
            console.log(`✅ Found ${count} existing roles`);
        }
        return true;
    } catch (err) {
        console.error("❌ Error initializing roles:", err.message);
        return false;
    }
};

const initializeAdminUser = async () => {
    try {
        const User = db.user;
        const Role = db.role;

        // First ensure roles are initialized
        const adminRole = await Role.findOne({ name: "admin" });

        if (!adminRole) {
            console.log("❌ Admin role not found. Please wait for role initialization...");
            // Wait a bit and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            return initializeAdminUser();
        }

        // Check if admin user already exists
        const adminExists = await User.findOne({ username: "admin" });
        if (!adminExists) {
            const adminUser = new User({
                username: "admin",
                email: "admin@supercoin.com",
                password: "admin123",
                fundPassword: "admin123",
                balance: 0,
                roles: [adminRole._id],
                isOnline: false,
                gender: "Male",
                signature: "Not set",
                avatar: ""
            });

            await adminUser.save();
            console.log("✅ Admin user created: username='admin', password='admin123'");
        } else {
            console.log("✅ Admin user already exists");

            // Ensure admin user has admin role
            await User.updateOne(
                { username: "admin" },
                { $set: { roles: [adminRole._id] } }
            );
            console.log("✅ Admin role assigned to existing admin user");
        }
        return true;
    } catch (err) {
        console.error("❌ Error creating admin user:", err.message);
        return false;
    }
};

// ✅ ADD DEBUG LOGS FOR ROUTE LOADING
console.log("🔄 Loading route files...");

require('./routes/auth.routes')(app);
require('./routes/exchange.routes')(app);
require('./routes/user.routes')(app);
require('./routes/trade.routes')(app);
require('./routes/profile.routes')(app);
require('./routes/recharge.routes')(app);
require('./routes/withdrawal.routes')(app);
require('./routes/admin.routes')(app);
require('./routes/fundhistory.routes')(app);
require('./routes/accessRequest.routes')(app);

console.log("🎯 All routes loaded successfully!");

// ==========================================
// ✅ FIX: SPA FALLBACK FOR RELOADING
// ==========================================
// If no API route is hit, send the React frontend (index.html)
// allowing React Router to handle /dashboard, /profile, etc.
app.get("*", (req, res) => {
    // Check if the request is for an API endpoint
    if (req.path.startsWith('/api')) {
        return res.status(404).send({ message: "API Endpoint not found" });
    }
    // Otherwise serve the frontend
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            // If frontend isn't built/present, send a basic message
            res.status(500).send("Frontend not found. Please build the React app and place it in backend/public.");
        }
    });
});

module.exports = app;
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const depositRoutes = require("./routes/deposits");
const enhancedDepositRoutes = require("./routes/enhancedDeposits");
const withdrawalRoutes = require("./routes/withdrawals");
const withdrawalScheduleRoutes = require("./routes/withdrawalSchedule");
const commissionRoutes = require("./routes/commissions");
const mlmRoutes = require("./routes/mlm");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const adminAuthRoutes = require("./routes/adminAuth");
const chapaRoutes = require("./routes/chapa");
const merchantRoutes = require("./routes/merchants");
const transactionRoutes = require("./routes/transactions");
const fileRoutes = require("./routes/files");
const cloudinaryRoutes = require("./routes/cloudinary");

// Import middleware
const authMiddleware = require("./middleware/auth");
const adminMiddleware = require("./middleware/admin");
const adminAuthMiddleware = require("./middleware/adminAuth");

// Load environment variables
// dotenv.config();
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allow all origins by default
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true, // Allow credentials if needed
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));
// Database connection
// mongoose.set("bufferCommands", false);

// mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin-auth",adminAuthRoutes);
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/deposits", authMiddleware, depositRoutes);
app.use("/api/enhanced-deposits", authMiddleware, enhancedDepositRoutes);
app.use("/api/withdrawals", authMiddleware, withdrawalRoutes);
app.use("/api/withdrawal-schedule", authMiddleware, withdrawalScheduleRoutes);
app.use("/api/commissions", authMiddleware, commissionRoutes);
app.use("/api/mlm", authMiddleware, mlmRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
// Only admins with view_users or view_transactions can access /api/admin endpoints
app.use(
  "/api/admin",
  authMiddleware,
  adminAuthMiddleware(),
  adminRoutes
);
// ["view_users", "view_transactions"]
app.use("/api/chapa", chapaRoutes);
app.use("/api/merchants", authMiddleware, merchantRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle Cloudinary errors
  if (err.message && err.message.includes("cloudinary")) {
    return res
      .status(400)
      .json({ message: "File upload error: " + err.message });
  }

  // Handle multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ message: "File too large. Maximum size is 10MB." });
  }

  if (err.message === "Only image and PDF files are allowed") {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

module.exports = app;

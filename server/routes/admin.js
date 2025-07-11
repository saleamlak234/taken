const express = require("express");
const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const Commission = require("../models/Commission");
const telegramService = require("../services/telegram");
const bcrypt = require("bcryptjs");
const adminAuthMiddleware = require("../middleware/adminAuth");

const router = express.Router();

// Get admin dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const lockedUsers = await User.countDocuments({
      lockedUntil: { $gt: new Date() },
    });

    // Financial statistics
    const totalDepositsResult = await Deposit.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalWithdrawalsResult = await Withdrawal.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalCommissionsResult = await Commission.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Pending transactions
    const pendingDeposits = await Deposit.countDocuments({
      status: "pending",
    });
    const pendingWithdrawals = await Withdrawal.countDocuments({
      status: "pending",
    });

    // Monthly revenue (current month)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyRevenueResult = await Deposit.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: {
            $gte: new Date(currentYear, currentMonth - 1, 1),
            $lt: new Date(currentYear, currentMonth, 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Recent transactions
    const recentTransactions = await Deposit.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentWithdrawals = await Withdrawal.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5);

    // Combine transactions
    const allRecentTransactions = [
      ...recentTransactions.map((t) => ({
        id: t._id,
        type: "deposit",
        amount: t.amount,
        status: t.status,
        user: t.user,
        createdAt: t.createdAt,
      })),
      ...recentWithdrawals.map((t) => ({
        id: t._id,
        type: "withdrawal",
        amount: t.amount,
        vat: t.vat,
        netAmount: t.netAmount,
        status: t.status,
        user: t.user,
        createdAt: t.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    // Recent users
    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      activeUsers,
      lockedUsers,
      totalDeposits: totalDepositsResult[0]?.total || 0,
      totalWithdrawals: totalWithdrawalsResult[0]?.total || 0,
      totalCommissions: totalCommissionsResult[0]?.total || 0,
      pendingDeposits,
      pendingWithdrawals,
      monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
      recentTransactions: allRecentTransactions,
      recentUsers,
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ message: "Server error fetching admin statistics" });
  }
});

// Get all users with security info
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // Add security status to each user
    const usersWithSecurity = users.map((user) => ({
      ...user.toObject(),
      // securityStatus: {
      //   isLocked: user.isLocked(),
      //   loginAttempts: user.loginAttempts || 0,
      //   maxLoginAttempts: user.maxLoginAttempts || 5,
      //   remainingMinutes: user.isLocked() ? user.getRemainingLockoutTime() : 0,
      //   lastFailedLogin: user.lastFailedLogin
      // }
    }));

    res.json({ users: usersWithSecurity });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// Update user status
router.put("/users/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send notification to user
    if (user.telegramChatId) {
      const message = isActive
        ? "✅ Your account has been activated!"
        : "❌ Your account has been deactivated. Please contact support.";

      await telegramService.sendMessage(user.telegramChatId, message);
    }

    res.json({ message: "User status updated successfully", user });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ message: "Server error updating user status" });
  }
});

// Unlock user account
router.post("/users/:userId/unlock", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reset login attempts and unlock account
    await user.resetLoginAttempts();

    // Send notification to user
    if (user.telegramChatId) {
      await telegramService.sendMessage(
        user.telegramChatId,
        "🔓 Your account has been unlocked by an administrator. You can now log in normally."
      );
    }

    res.json({ message: "User account unlocked successfully" });
  } catch (error) {
    console.error("Unlock user account error:", error);
    res.status(500).json({ message: "Server error unlocking user account" });
  }
});

// Get security overview
router.get("/security-overview", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const lockedUsers = await User.countDocuments({
      lockedUntil: { $gt: new Date() },
    });
    const usersWithFailedAttempts = await User.countDocuments({
      loginAttempts: { $gt: 0 },
    });

    // Get recent failed login attempts
    const recentFailedLogins = await User.find({
      lastFailedLogin: { $exists: true, $ne: null },
    })
      .select("fullName email lastFailedLogin loginAttempts lockedUntil")
      .sort({ lastFailedLogin: -1 })
      .limit(10);

    res.json({
      totalUsers,
      lockedUsers,
      usersWithFailedAttempts,
      recentFailedLogins: recentFailedLogins.map((user) => ({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        lastFailedLogin: user.lastFailedLogin,
        loginAttempts: user.loginAttempts,
        isLocked: user.isLocked(),
        remainingMinutes: user.isLocked() ? user.getRemainingLockoutTime() : 0,
      })),
    });
  } catch (error) {
    console.error("Get security overview error:", error);
    res
      .status(500)
      .json({ message: "Server error fetching security overview" });
  }
});

// Get all transactions
router.get("/transactions", async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .populate("user", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    const withdrawals = await Withdrawal.find()
      .populate("user", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    // Combine and format transactions
    const transactions = [
      ...deposits.map((d) => ({
        id: d._id,
        type: "deposit",
        amount: d.amount,
        status: d.status,
        paymentMethod: d.paymentMethod,
        user: d.user,
        receiptUrl: d.receiptUrl,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      ...withdrawals.map((w) => ({
        id: w._id,
        type: "withdrawal",
        amount: w.amount,
        vat: w.vat,
        netAmount: w.netAmount,
        status: w.status,
        paymentMethod: w.paymentMethod,
        user: w.user,
        accountDetails: w.accountDetails,
        rejectionReason: w.rejectionReason,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ transactions });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: "Server error fetching transactions" });
  }
});

// Get single transaction
router.get("/transactions/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Try to find in deposits first
    let transaction = await Deposit.findById(transactionId).populate(
      "user",
      "fullName email phoneNumber"
    );

    if (transaction) {
      return res.json({
        transaction: {
          id: transaction._id,
          type: "deposit",
          amount: transaction.amount,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          user: transaction.user,
          receiptUrl: transaction.receiptUrl,
          rejectionReason: transaction.rejectionReason,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      });
    }

    // Try withdrawals
    transaction = await Withdrawal.findById(transactionId).populate(
      "user",
      "fullName email phoneNumber"
    );

    if (transaction) {
      return res.json({
        transaction: {
          id: transaction._id,
          type: "withdrawal",
          amount: transaction.amount,
          vat: transaction.vat,
          netAmount: transaction.netAmount,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          user: transaction.user,
          accountDetails: transaction.accountDetails,
          rejectionReason: transaction.rejectionReason,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      });
    }

    res.status(404).json({ message: "Transaction not found" });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({ message: "Server error fetching transaction" });
  }
});

// Update transaction status
router.put("/transactions/:transactionId",  async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { action, rejectionReason } = req.body;

    // Find transaction in deposits or withdrawals
    let transaction = await Deposit.findById(transactionId).populate("user");
    let isDeposit = true;

    if (!transaction) {
      transaction = await Withdrawal.findById(transactionId).populate("user");
      isDeposit = false;
    }

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Transaction is not pending" });
    }

    // Update transaction status
    const newStatus = action === "approve" ? "completed" : "rejected";
    transaction.status = newStatus;
    transaction.processedBy = req.user._id;
    transaction.processedAt = new Date();

    if (action === "reject" && rejectionReason) {
      transaction.rejectionReason = rejectionReason;
    }

    await transaction.save();

    if (isDeposit && action === "approve") {
      // Process deposit approval
      await processDepositApproval(transaction);
    } else if (!isDeposit) {
      // Process withdrawal
      await processWithdrawal(transaction, action);
    }

    // Send notification to user
    if (transaction.user.telegramChatId) {
      const message = isDeposit
        ? action === "approve"
          ? `✅ Your deposit of ${transaction.amount.toLocaleString()} ETB has been approved!`
          : `❌ Your deposit has been rejected. Reason: ${rejectionReason || "Not specified"}`
        : action === "approve"
          ? `✅ Your withdrawal of ${transaction.amount.toLocaleString()} ETB has been processed!`
          : `❌ Your withdrawal has been rejected. Reason: ${rejectionReason || "Not specified"}`;

      await telegramService.sendMessage(
        transaction.user.telegramChatId,
        message
      );
    }

    res.json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ message: "Server error updating transaction" });
  }
});

// Register new admin
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Generate unique referral code
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = generateReferralCode();
      const existing = await User.findOne({ referralCode: newReferralCode });
      if (!existing) isUnique = true;
    }

    // Create admin user
    const user = new User({
      fullName,
      email,
      phoneNumber,
      password,
      role: "admin",
      referralCode: newReferralCode,
      isActive: true,
    });

    await user.save();

    res.status(201).json({
      message: "Admin account created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ message: "Server error during admin registration" });
  }
});

// Helper function to process deposit approval
async function processDepositApproval(deposit) {
  try {
    // Update user's total deposits
    await User.findByIdAndUpdate(deposit.user._id, {
      $inc: { totalDeposits: deposit.amount },
    });

    // Process commissions
    await processDepositCommissions(deposit);
  } catch (error) {
    console.error("Process deposit approval error:", error);
  }
}

// Helper function to process withdrawal
async function processWithdrawal(withdrawal, action) {
  try {
    if (action === "approve") {
      // Update user's total withdrawals
      await User.findByIdAndUpdate(withdrawal.user._id, {
        $inc: { totalWithdrawals: withdrawal.amount },
      });
    } else {
      // Return amount to user balance if rejected
      await User.findByIdAndUpdate(withdrawal.user._id, {
        $inc: { balance: withdrawal.amount },
      });
    }
  } catch (error) {
    console.error("Process withdrawal error:", error);
  }
}

// Process commission for approved deposit
async function processDepositCommissions(deposit) {
  try {
    const user = await User.findById(deposit.user).populate("referredBy");
    if (!user || !user.referredBy) return;

    const commissionRates = [0.08, 0.04, 0.02, 0.01]; // 8%, 4%, 2%, 1%
    let currentUser = user.referredBy;
    let level = 1;

    while (currentUser && level <= 4) {
      const commissionAmount = deposit.amount * commissionRates[level - 1];

      // Create commission record
      const commission = new Commission({
        user: currentUser._id,
        fromUser: deposit.user,
        amount: commissionAmount,
        level,
        type: "deposit",
        description: `Level ${level} commission from ${user.fullName}'s deposit`,
        sourceTransaction: deposit._id,
        sourceModel: "Deposit",
      });

      await commission.save();

      // Update user balance and commission total
      await User.findByIdAndUpdate(currentUser._id, {
        $inc: {
          balance: commissionAmount,
          totalCommissions: commissionAmount,
        },
      });

      // Send notification
      if (currentUser.telegramChatId) {
        await telegramService.sendMessage(
          currentUser.telegramChatId,
          `💰 Commission earned!\n` +
            `Amount: ${commissionAmount.toLocaleString()} ETB\n` +
            `Level: ${level}\n` +
            `From: ${user.fullName}'s deposit`
        );
      }

      // Move to next level
      const nextUser = await User.findById(currentUser._id).populate(
        "referredBy"
      );
      currentUser = nextUser?.referredBy;
      level++;
    }
  } catch (error) {
    console.error("Commission processing error:", error);
  }
}

// Helper function to generate referral code
function generateReferralCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;

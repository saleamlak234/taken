const express = require("express");
const TransactionHistory = require("../models/TransactionHistory");
const MerchantAccount = require("../models/MerchantAccount");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

// Get user's transaction history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const userId = req.user._id;

    const filter = { user: userId };
    if (type) filter.transactionType = type;
    if (status) filter.status = status;

    const transactions = await TransactionHistory.find(filter)
      .populate("merchantAccount", "bankName accountNumber accountHolder")
      .populate("processedBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TransactionHistory.countDocuments(filter);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get transaction history error:", error);
    res
      .status(500)
      .json({ message: "Server error fetching transaction history" });
  }
});

// Get transaction by reference number
router.get("/reference/:refNumber", authMiddleware, async (req, res) => {
  try {
    const transaction = await TransactionHistory.findOne({
      referenceNumber: req.params.refNumber,
      user: req.user._id,
    })
      .populate(
        "merchantAccount",
        "bankName accountNumber accountHolder qrCode"
      )
      .populate("processedBy", "fullName");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ transaction });
  } catch (error) {
    console.error("Get transaction by reference error:", error);
    res.status(500).json({ message: "Server error fetching transaction" });
  }
});

// Admin: Get all transactions
router.get("/admin/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      userId,
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (type) filter.transactionType = type;
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await TransactionHistory.find(filter)
      .populate("user", "fullName email phoneNumber")
      .populate("merchantAccount", "bankName accountNumber accountHolder")
      .populate("processedBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TransactionHistory.countDocuments(filter);

    // Get summary statistics
    const stats = await TransactionHistory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats,
    });
  } catch (error) {
    console.error("Get admin transactions error:", error);
    res.status(500).json({ message: "Server error fetching transactions" });
  }
});

// Admin: Process transaction
router.put(
  "/admin/:id/process",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status, rejectionReason } = req.body;
      const transactionId = req.params.id;

      // Check admin permissions: must have 'process_transactions'
      const AdminRole = require("../models/AdminRole");
      const adminRole = await AdminRole.findOne({ user: req.user._id });
      if (
        !adminRole ||
        !adminRole.permissions.includes("process_transactions")
      ) {
        return res
          .status(403)
          .json({
            message: "You do not have permission to process transactions.",
          });
      }

      const transaction =
        await TransactionHistory.findById(transactionId).populate("user");

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not pending" });
      }

      transaction.status = status;
      transaction.processedBy = req.user._id;
      transaction.processedAt = new Date();

      if (status === "rejected" && rejectionReason) {
        transaction.rejectionReason = rejectionReason;
      }

      await transaction.save();

      // Process based on transaction type and status
      if (status === "completed") {
        await processCompletedTransaction(transaction);
      } else if (status === "rejected") {
        await processRejectedTransaction(transaction);
      }

      res.json({
        message: "Transaction processed successfully",
        transaction,
      });
    } catch (error) {
      console.error("Process transaction error:", error);
      res.status(500).json({ message: "Server error processing transaction" });
    }
  }
);

// Helper function to process completed transactions
async function processCompletedTransaction(transaction) {
  try {
    const user = await User.findById(transaction.user);

    switch (transaction.transactionType) {
      case "deposit":
        // Update user's total deposits
        await User.findByIdAndUpdate(user._id, {
          $inc: { totalDeposits: transaction.amount },
        });
        break;

      case "withdrawal":
        // Update user's total withdrawals
        await User.findByIdAndUpdate(user._id, {
          $inc: { totalWithdrawals: transaction.amount },
        });
        break;

      case "commission":
      case "daily_earning":
        // Add to user balance
        await User.findByIdAndUpdate(user._id, {
          $inc: { balance: transaction.amount },
        });
        break;
    }
  } catch (error) {
    console.error("Process completed transaction error:", error);
  }
}

// Helper function to process rejected transactions
async function processRejectedTransaction(transaction) {
  try {
    if (transaction.transactionType === "withdrawal") {
      // Return amount to user balance if withdrawal was rejected
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { balance: transaction.amount },
      });
    }
  } catch (error) {
    console.error("Process rejected transaction error:", error);
  }
}

module.exports = router;

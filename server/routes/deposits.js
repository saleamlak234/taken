const express = require("express");
const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Commission = require("../models/Commission");
const telegramService = require("../services/telegram");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Get user deposits
router.get("/", async (req, res) => {
  try {
    const deposits = await Deposit.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ deposits });
  } catch (error) {
    console.error("Get deposits error:", error);
    res.status(500).json({ message: "Server error fetching deposits" });
  }
});

// Create new deposit with Cloudinary upload
router.post("/", upload.single("receiptUrl"), async (req, res) => {
  try {
    const {
      amount,
      package: packageName,
      paymentMethod,
      merchantId,
    } = req.body;
    const userId = req.user._id;

    // Validate package and amount
    const packagePrices = {
      "7th Stock Package": 192000,
      "6th Stock Package": 96000,
      "5th Stock Package": 48000,
      "4th Stock Package": 24000,
      "3rd Stock Package": 12000,
      "2nd Stock Package": 6000,
      "1st Stock Package": 3000,
    };

    if (!packagePrices[packageName]) {
      return res.status(400).json({ message: "Invalid package selected" });
    }

    if (parseInt(amount) !== packagePrices[packageName]) {
      return res
        .status(400)
        .json({ message: "Amount does not match package price" });
    }

    // // Require receipt upload
    // if (!req.file || !req.file.secure_url) {
    //   return res.status(400).json({ message: 'Payment receipt is required and must be uploaded successfully' });
    // }
    if (!req.body.receiptUrl) {
      return res.status(400).json({ message: "Payment receipt is required" });
    }

    // Create deposit record with Cloudinary URL
    const deposit = new Deposit({
      user: userId,
      amount: parseInt(amount),
      package: packageName,
      paymentMethod: "manual_transfer",
      receiptUrl: req.body.receiptUrl,
      receiptPublicId: req.body.receiptPublicId,
      receiptMetadata: {
        originalName: req.body.receiptMetadata?.originalName,
        format: req.body.receiptMetadata?.format,
        size: req.body.receiptMetadata?.size,
        uploadedAt: new Date(),
      },
    });

    await deposit.save();

    // Send notification to admin via Telegram
    await telegramService.sendToAdmin(
      `💰 New deposit request:\n` +
        `User: ${req.user.fullName}\n` +
        `Package: ${packageName}\n` +
        `Amount: ${amount.toLocaleString()} ETB\n` +
        `Payment: Manual Transfer\n` +
        `Receipt: ${req.body.receiptUrl}`
    );

    res.status(201).json({
      message: "Deposit request created successfully",
      deposit: {
        ...deposit.toObject(),
        receiptThumbnail: req.body.receiptUrl?.replace(
          "/upload/",
          "/upload/w_200,h_200,c_fill/"
        ),
      },
    });
  } catch (error) {
    console.error("Create deposit error:", error);
    res.status(500).json({ message: "Server error creating deposit" });
  }
});

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

module.exports = router;

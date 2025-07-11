const express = require('express');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const telegramService = require('../services/telegram');

const router = express.Router();

// Get user withdrawals
router.get('/', async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ withdrawals });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Server error fetching withdrawals' });
  }
});

// Create withdrawal request
router.post('/', async (req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;
    const userId = req.user._id;

    // Restrict withdrawals to once per day (per user)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const existingWithdrawal = await Withdrawal.findOne({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    if (existingWithdrawal) {
      return res.status(400).json({ message: 'You can only make one withdrawal per day.' });
    }

    // Restrict withdrawals to between 4:00 AM and 11:00 PM
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour < 4 || currentHour >= 23) {
      return res.status(400).json({ message: 'Withdrawals are allowed only between 4:00 AM and 11:00 PM.' });
    }

    // Validate amount
    if (amount < 1000) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is 1000 ETB' });
    }

    if (amount > req.user.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Validate account details
    if (paymentMethod === 'bank') {
      if (!accountDetails.accountNumber || !accountDetails.bankName) {
        return res.status(400).json({ message: 'Bank account details are required' });
      }
    } else if (paymentMethod === 'telebirr') {
      if (!accountDetails.phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required for TeleBirr' });
      }
    }

    // Calculate VAT (15%) and net amount
    const vat = Math.round(amount * 0.15);
    const netAmount = amount - vat;

    // Create withdrawal request with VAT and net amount
    const withdrawal = new Withdrawal({
      user: userId,
      amount, // original requested amount
      vat,
      netAmount,
      paymentMethod,
      accountDetails
    });

    await withdrawal.save();

    // Deduct amount from user balance (pending withdrawal)
    await User.findByIdAndUpdate(userId, {
      $inc: { balance: -amount }
    });

    // Send notification to admin
    await telegramService.sendToAdmin(
      `💸 New withdrawal request:\n` +
      `User: ${req.user.fullName}\n` +
      `Amount: ${amount.toLocaleString()} ETB\n` +
      `VAT (15%): ${vat.toLocaleString()} ETB\n` +
      `Net Amount: ${netAmount.toLocaleString()} ETB\n` +
      `Method: ${paymentMethod}\n` +
      `Details: ${JSON.stringify(accountDetails, null, 2)}`
    );

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      withdrawal,
      vat,
      netAmount
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ message: 'Server error creating withdrawal request' });
  }
});

module.exports = router;
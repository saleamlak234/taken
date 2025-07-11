const express = require('express');
const multer = require('multer');
const path = require('path');
const Deposit = require('../models/Deposit');
const MerchantAccount = require('../models/MerchantAccount');
const TransactionHistory = require('../models/TransactionHistory');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Enhanced multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Get available packages with merchant accounts
router.get('/packages', authMiddleware, async (req, res) => {
  try {
    const packages = [
      { name: '7th Stock Package', price: 192000, dailyReturn: 3200 },
      { name: '6th Stock Package', price: 96000, dailyReturn: 1600 },
      { name: '5th Stock Package', price: 48000, dailyReturn: 800 },
      { name: '4th Stock Package', price: 24000, dailyReturn: 400 },
      { name: '3rd Stock Package', price: 12000, dailyReturn: 200 },
      { name: '2nd Stock Package', price: 6000, dailyReturn: 100 },
      { name: '1st Stock Package', price: 3000, dailyReturn: 50 }
    ];

    // Get available merchant accounts
    const merchants = await MerchantAccount.find({ isActive: true })
      .select('bankName accountNumber accountHolder branch qrCode');

    res.json({ packages, merchants });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ message: 'Server error fetching packages' });
  }
});

// Create deposit with merchant account selection
router.post('/create', upload.single('receipt'), async (req, res) => {
  try {
    const { amount, package: packageName, merchantId } = req.body;
    const userId = req.user._id;

    // Validate package and amount
    const packagePrices = {
      '7th Stock Package': 192000,
      '6th Stock Package': 96000,
      '5th Stock Package': 48000,
      '4th Stock Package': 24000,
      '3rd Stock Package': 12000,
      '2nd Stock Package': 6000,
      '1st Stock Package': 3000
    };

    if (!packagePrices[packageName]) {
      return res.status(400).json({ message: 'Invalid package selected' });
    }

    if (parseInt(amount) !== packagePrices[packageName]) {
      return res.status(400).json({ message: 'Amount does not match package price' });
    }

    // Validate merchant account
    const merchant = await MerchantAccount.findById(merchantId);
    if (!merchant || !merchant.isActive) {
      return res.status(400).json({ message: 'Invalid merchant account selected' });
    }

    // Check daily limit for merchant
    merchant.resetDailyAmountIfNeeded();
    if (merchant.currentDailyAmount + parseInt(amount) > merchant.dailyLimit) {
      return res.status(400).json({ 
        message: 'Merchant daily limit exceeded. Please select another merchant account.' 
      });
    }

    // Create deposit record
    const deposit = new Deposit({
      user: userId,
      amount: parseInt(amount),
      package: packageName,
      paymentMethod: 'manual_transfer',
      receiptUrl: req.file ? `/uploads/receipts/${req.file.filename}` : null
    });

    await deposit.save();

    // Create transaction history
    const transaction = new TransactionHistory({
      user: userId,
      transactionType: 'deposit',
      amount: parseInt(amount),
      status: 'pending',
      merchantAccount: merchantId,
      receiptUrl: deposit.receiptUrl,
      description: `Deposit for ${packageName}`,
      metadata: {
        depositId: deposit._id,
        packageName,
        merchantId
      }
    });

    await transaction.save();

    // Update merchant daily amount
    merchant.currentDailyAmount += parseInt(amount);
    await merchant.save();

    // Populate merchant info for response
    await transaction.populate('merchantAccount', 'bankName accountNumber accountHolder qrCode');

    res.status(201).json({
      message: 'Deposit request created successfully',
      deposit,
      transaction,
      merchantAccount: transaction.merchantAccount
    });
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ message: 'Server error creating deposit' });
  }
});

// Get deposit with merchant details
router.get('/:id/details', authMiddleware, async (req, res) => {
  try {
    const deposit = await Deposit.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

    // Get associated transaction
    const transaction = await TransactionHistory.findOne({
      'metadata.depositId': deposit._id
    }).populate('merchantAccount', 'bankName accountNumber accountHolder branch qrCode');

    res.json({
      deposit,
      transaction,
      merchantAccount: transaction?.merchantAccount
    });
  } catch (error) {
    console.error('Get deposit details error:', error);
    res.status(500).json({ message: 'Server error fetching deposit details' });
  }
});

module.exports = router;
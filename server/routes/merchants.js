const express = require('express');
const MerchantAccount = require('../models/MerchantAccount');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const QRCode = require('qrcode');

const router = express.Router();

// Get all active merchant accounts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const merchants = await MerchantAccount.find({ isActive: true })
      .select('-currentDailyAmount -lastResetDate');
    
    res.json({ merchants });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ message: 'Server error fetching merchant accounts' });
  }
});

// Get merchant by ID with QR code
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const merchant = await MerchantAccount.findById(req.params.id);
    
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant account not found' });
    }

    // Generate QR code if not exists
    if (!merchant.qrCode) {
      const qrData = {
        bankName: merchant.bankName,
        accountNumber: merchant.accountNumber,
        accountHolder: merchant.accountHolder,
        branch: merchant.branch
      };
      
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
      merchant.qrCode = qrCodeDataURL;
      await merchant.save();
    }

    res.json({ merchant });
  } catch (error) {
    console.error('Get merchant error:', error);
    res.status(500).json({ message: 'Server error fetching merchant account' });
  }
});

// Admin routes for merchant management
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bankName, accountNumber, accountHolder, branch, description } = req.body;

    // Check if account number already exists
    const existingMerchant = await MerchantAccount.findOne({ accountNumber });
    if (existingMerchant) {
      return res.status(400).json({ message: 'Account number already exists' });
    }

    const merchant = new MerchantAccount({
      bankName,
      accountNumber,
      accountHolder,
      branch,
      description
    });

    // Generate QR code
    const qrData = {
      bankName,
      accountNumber,
      accountHolder,
      branch
    };
    
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
    merchant.qrCode = qrCodeDataURL;

    await merchant.save();

    res.status(201).json({
      message: 'Merchant account created successfully',
      merchant
    });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({ message: 'Server error creating merchant account' });
  }
});

// Update merchant account
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { bankName, accountNumber, accountHolder, branch, description, isActive } = req.body;

    const merchant = await MerchantAccount.findById(req.params.id);
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant account not found' });
    }

    // Check if new account number conflicts with existing ones
    if (accountNumber !== merchant.accountNumber) {
      const existingMerchant = await MerchantAccount.findOne({ 
        accountNumber, 
        _id: { $ne: req.params.id } 
      });
      if (existingMerchant) {
        return res.status(400).json({ message: 'Account number already exists' });
      }
    }

    // Update fields
    merchant.bankName = bankName || merchant.bankName;
    merchant.accountNumber = accountNumber || merchant.accountNumber;
    merchant.accountHolder = accountHolder || merchant.accountHolder;
    merchant.branch = branch || merchant.branch;
    merchant.description = description || merchant.description;
    merchant.isActive = isActive !== undefined ? isActive : merchant.isActive;

    // Regenerate QR code if account details changed
    if (bankName || accountNumber || accountHolder || branch) {
      const qrData = {
        bankName: merchant.bankName,
        accountNumber: merchant.accountNumber,
        accountHolder: merchant.accountHolder,
        branch: merchant.branch
      };
      
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
      merchant.qrCode = qrCodeDataURL;
    }

    await merchant.save();

    res.json({
      message: 'Merchant account updated successfully',
      merchant
    });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({ message: 'Server error updating merchant account' });
  }
});

// Delete merchant account
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const merchant = await MerchantAccount.findById(req.params.id);
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant account not found' });
    }

    await MerchantAccount.findByIdAndDelete(req.params.id);

    res.json({ message: 'Merchant account deleted successfully' });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({ message: 'Server error deleting merchant account' });
  }
});

module.exports = router;
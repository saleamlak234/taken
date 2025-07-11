const mongoose = require('mongoose');

const merchantAccountSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accountHolder: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  qrCode: {
    type: String, // Base64 encoded QR code or file path
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  dailyLimit: {
    type: Number,
    default: 1000000 // 1M ETB daily limit
  },
  currentDailyAmount: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Reset daily amount if it's a new day
merchantAccountSchema.methods.resetDailyAmountIfNeeded = function() {
  const today = new Date();
  const lastReset = new Date(this.lastResetDate);
  
  if (today.toDateString() !== lastReset.toDateString()) {
    this.currentDailyAmount = 0;
    this.lastResetDate = today;
  }
};

module.exports = mongoose.model('MerchantAccount', merchantAccountSchema);
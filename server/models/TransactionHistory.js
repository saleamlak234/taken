const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'commission', 'daily_earning'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  referenceNumber: {
    type: String,
    unique: true,
    required: true
  },
  merchantAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MerchantAccount',
    default: null
  },
  receiptUrl: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Generate unique reference number
transactionHistorySchema.pre('save', async function(next) {
  if (!this.referenceNumber) {
    const prefix = this.transactionType.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referenceNumber = `${prefix}${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('TransactionHistory', transactionHistorySchema);
const mongoose = require('mongoose');

const withdrawalScheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  paymentMethod: {
    type: String,
    enum: ['bank', 'telebirr', 'manual-transfer'],
    required: true
  },
  accountDetails: {
    accountNumber: String,
    bankName: String,
    phoneNumber: String
  },
  processedAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WithdrawalSchedule', withdrawalScheduleSchema);
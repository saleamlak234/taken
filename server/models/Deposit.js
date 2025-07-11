const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
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
  package: {
    type: String,
    required: true,
    enum: ['7th Stock Package', '6th Stock Package', '5th Stock Package', '4th Stock Package','3rd Stock Package','2nd Stock Package','1st Stock Package']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['manual_transfer', 'bank_transfer', 'telebirr']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'pending'
  },
  receiptUrl: {
    type: String,
    default: null
  },
  receiptPublicId: {
    type: String,
    default: null
  },
  receiptMetadata: {
    originalName: String,
    format: String,
    size: Number,
    uploadedAt: Date
  },
  chapaReference: {
    type: String,
    default: null
  },
  chapaTransactionId: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Calculate monthly return based on package
depositSchema.methods.getMonthlyReturn = function() {
  const returnRates = {
    '7th Stock Package': 192000,
    '6th Stock Package': 96000,
    '5th Stock Package': 48000,
    '4th Stock Package': 24000,
    '3rd Stock Package': 12000,
    '2nd Stock Package': 6000,
    '1st Stock Package': 3000
  };
  return returnRates[this.package] || 0;
};

// Get optimized receipt URL
depositSchema.methods.getOptimizedReceiptUrl = function(options = {}) {
  if (!this.receiptUrl) return null;
  
  const baseUrl = this.receiptUrl;
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  
  if (transformations.length > 0) {
    return baseUrl.replace('/upload/', `/upload/${transformations.join(',')}/`);
  }
  
  return baseUrl;
};

// Get thumbnail URL
depositSchema.methods.getThumbnailUrl = function() {
  return this.getOptimizedReceiptUrl({ width: 200, height: 200, quality: 'auto' });
};

module.exports = mongoose.model('Deposit', depositSchema);
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     fullName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     phoneNumber: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: true,
//       minlength: 6,
//     },
//     role: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },
//     referralCode: {
//       type: String,
//       unique: true,
//       required: true,
//     },
//     referredBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     balance: {
//       type: Number,
//       default: 0,
//     },
//     totalDeposits: {
//       type: Number,
//       default: 0,
//     },
//     totalWithdrawals: {
//       type: Number,
//       default: 0,
//     },
//     totalCommissions: {
//       type: Number,
//       default: 0,
//     },
//     level: {
//       type: Number,
//       default: 1,
//     },
//     directReferrals: {
//       type: Number,
//       default: 0,
//     },
//     totalTeamSize: {
//       type: Number,
//       default: 0,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     lastLoginAt: {
//       type: Date,
//       default: null,
//     },
//     resetPasswordToken: {
//       type: String,
//       default: null,
//     },
//     resetPasswordExpires: {
//       type: Date,
//       default: null,
//     },
//     telegramChatId: {
//       type: String,
//       default: null,
//     },
//     // Login attempt tracking
//     loginAttempts: {
//       type: Number,
//       default: 0,
//     },
//     lockedUntil: {
//       type: Date,
//       default: null,
//     },
//     lastFailedLogin: {
//       type: Date,
//       default: null,
//     },
//     // Security settings
//     maxLoginAttempts: {
//       type: Number,
//       default: 5,
//     },
//     lockoutDuration: {
//       type: Number,
//       default: 15 * 60 * 1000, // 15 minutes in milliseconds
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Pre-save middleware for password hashing
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Password comparison method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // Check if account is locked
// userSchema.methods.isLocked = function () {
//   return !!(this.lockedUntil && this.lockedUntil > Date.now());
// };

// // Increment login attempts
// userSchema.methods.incLoginAttempts = async function () {
//   if (this.lockedUntil && this.lockedUntil < Date.now()) {
//     this.lockedUntil = null;
//     this.loginAttempts = 1;
//     this.lastFailedLogin = new Date();
//   } else {
//     this.loginAttempts = (this.loginAttempts || 0) + 1;
//     this.lastFailedLogin = new Date();
//   }
//   if (this.loginAttempts >= (this.maxLoginAttempts || 5) && !this.isLocked()) {
//     this.lockedUntil = Date.now() + (this.lockoutDuration || 15 * 60 * 1000);
//   }
//   await this.save();
// };

// // Reset login attempts
// userSchema.methods.resetLoginAttempts = async function () {
//   this.loginAttempts = 0;
//   this.lockedUntil = null;
//   this.lastFailedLogin = null;
//   await this.save();
// };

// // Get remaining lockout time in minutes
// userSchema.methods.getRemainingLockoutTime = function () {
//   if (!this.isLocked()) return 0;
//   return Math.ceil((this.lockedUntil - Date.now()) / (60 * 1000));
// };

// // Generate referral code method
// // userSchema.methods.generateReferralCode = function() {
// //   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// //   let result = '';
// //   for (let i = 0; i < 8; i++) {
// //     result += chars.charAt(Math.floor(Math.random() * chars.length));
// //   }
// //   return result;
// // };

// module.exports = mongoose.model("User", userSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  referralCode: {
    type: String,
    unique: true,
    required: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  balance: {
    type: Number,
    default: 0
  },
  totalDeposits: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  totalCommissions: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  directReferrals: {
    type: Number,
    default: 0
  },
  totalTeamSize: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  telegramChatId: {
    type: String,
    default: null
  },
  // Login attempt tracking
//   loginAttempts: {
//     type: Number,
//     default: 0
//   },
//   lockedUntil: {
//     type: Date,
//     default: null
//   },
//   lastFailedLogin: {
//     type: Date,
//     default: null
//   },
//   // Security settings
//   maxLoginAttempts: {
//     type: Number,
//     default: 5
//   },
//   lockoutDuration: {
//     type: Number,
//     default: 30 * 60 * 1000 // 30 minutes in milliseconds
//   }
}, {
  timestamps: true
});

// // Pre-save middleware for password hashing
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Password comparison method
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// // Check if account is locked
// userSchema.methods.isLocked = function() {
//   return !!(this.lockedUntil && this.lockedUntil > Date.now());
// };

// // Increment login attempts
// userSchema.methods.incLoginAttempts = function() {
//   // If we have a previous lock that has expired, restart at 1
//   if (this.lockedUntil && this.lockedUntil < Date.now()) {
//     return this.updateOne({
//       $unset: { lockedUntil: 1 },
//       $set: { 
//         loginAttempts: 1,
//         lastFailedLogin: new Date()
//       }
//     });
//   }
  
//   const updates = { 
//     $inc: { loginAttempts: 1 },
//     $set: { lastFailedLogin: new Date() }
//   };
  
//   // Lock account if we've reached max attempts and it's not locked already
//   if (this.loginAttempts + 1 >= this.maxLoginAttempts && !this.isLocked()) {
//     updates.$set.lockedUntil = Date.now() + this.lockoutDuration;
//   }
  
//   return this.updateOne(updates);
// };

// // Reset login attempts
// userSchema.methods.resetLoginAttempts = function() {
//   return this.updateOne({
//     $unset: { 
//       loginAttempts: 1, 
//       lockedUntil: 1,
//       lastFailedLogin: 1
//     }
//   });
// };

// Get remaining lockout time in minutes
// userSchema.methods.getRemainingLockoutTime = function() {
//   if (!this.isLocked()) return 0;
//   return Math.ceil((this.lockedUntil - Date.now()) / (60 * 1000));
// };

// Generate referral code method
// userSchema.methods.generateReferralCode = function() {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let result = '';
//   for (let i = 0; i < 8; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return result;
// };

module.exports = mongoose.model('User', userSchema);
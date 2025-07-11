const mongoose = require("mongoose");

const adminRoleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "view_admin_1", "view_admin_2"],
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "view_users",
          "edit_users",
          "delete_users",
          "view_transactions",
          "process_transactions",
          "view_reports",
          "manage_merchants",
          "system_settings",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  //   loginAttempts: {
  //     type: Number,
  //     default: 0,
  //   },
  //   lockedUntil: {
  //     type: Date,
  //     default: null,
  //   },
  //   // Security settings
  //   maxLoginAttempts: {
  //     type: Number,
  //     default: 5,
  //   },
  //   lockoutDuration: {
  //     type: Number,
  //     default: 15 * 60 * 1000, // 15 minutes in milliseconds
  //   },
  },
  {
    timestamps: true,
  }
);

// Check if account is locked
// adminRoleSchema.methods.isLocked = function () {
//   return !!(this.lockedUntil && this.lockedUntil > Date.now());
// };

// // Increment login attempts
// adminRoleSchema.methods.incLoginAttempts = async function () {
//   if (this.lockedUntil && this.lockedUntil < Date.now()) {
//     this.lockedUntil = null;
//     this.loginAttempts = 1;
//   } else {
//     this.loginAttempts = (this.loginAttempts || 0) + 1;
//   }
//   if (this.loginAttempts >= (this.maxLoginAttempts || 5) && !this.isLocked()) {
//     this.lockedUntil = Date.now() + (this.lockoutDuration || 15 * 60 * 1000);
//   }
//   await this.save();
// };

// // Reset login attempts
// adminRoleSchema.methods.resetLoginAttempts = async function () {
//   this.loginAttempts = 0;
//   this.lockedUntil = null;
//   await this.save();
// };

// // Get remaining lockout time in minutes
// adminRoleSchema.methods.getRemainingLockoutTime = function () {
//   if (!this.isLocked()) return 0;
//   return Math.ceil((this.lockedUntil - Date.now()) / (60 * 1000));
// };

module.exports = mongoose.model("AdminRole", adminRoleSchema);

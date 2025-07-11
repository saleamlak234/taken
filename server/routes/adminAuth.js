// const express = require("express");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const AdminRole = require("../models/AdminRole");
// const authMiddleware = require("../middleware/auth");
// const bcrypt = require("bcryptjs");

// const router = express.Router();

// // Admin login with enhanced security
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ email, role: "admin" });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid admin credentials" });
//     }

//     // Check admin role
//     const adminRole = await AdminRole.findOne({ user: user._id });
//     if (!adminRole || !adminRole.isActive) {
//       return res.status(403).json({ message: "Admin access not configured" });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid admin credentials" });
//     }
//     // Create a new admin (super admin only)
//     router.post("/create-admin", authMiddleware, async (req, res) => {
//       try {
//         const { fullName, email, phoneNumber, password, role } = req.body;

//         // Only super admin can create new admins
//         const currentAdminRole = await AdminRole.findOne({
//           user: req.user._id,
//         });
//         if (!currentAdminRole || currentAdminRole.role !== "super_admin") {
//           return res
//             .status(403)
//             .json({ message: "Only super admin can create admins" });
//         }

//         // Check if user already exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//           return res
//             .status(400)
//             .json({ message: "User already exists with this email" });
//         }

//         // Create user with admin role
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newUser = new User({
//           fullName,
//           email,
//           phoneNumber,
//           password: hashedPassword,
//           role: "admin",
//           isActive: true,
//         });
//         await newUser.save();

//         // Assign admin role and permissions

//         let adminRoleName = role || "view_admin_1";
//         let permissions = [];
//         switch (adminRoleName) {
//           case "super_admin":
//             permissions = [
//               "view_users",
//               "edit_users",
//               "delete_users",
//               "view_transactions",
//               "process_transactions",
//               "view_reports",
//               "manage_merchants",
//               "system_settings",
//             ];
//             break;
//           case "view_admin_1":
//           default:
//             permissions = ["view_users", "view_transactions", "view_reports"];
//             break;
//         }

//         const newAdminRole = new AdminRole({
//           user: newUser._id,
//           role: adminRoleName,
//           permissions,
//           isActive: true,
//         });
//         await newAdminRole.save();

//         res.status(201).json({
//           message: "Admin created successfully",
//           user: {
//             id: newUser._id,
//             fullName: newUser.fullName,
//             email: newUser.email,
//             role: newUser.role,
//           },
//           adminRole: newAdminRole,
//         });
//       } catch (error) {
//         console.error("Create admin error:", error);
//         res.status(500).json({ message: "Server error creating admin" });
//       }
//     });

//     // Update last login
//     adminRole.lastLogin = new Date();
//     await adminRole.save();

//     user.lastLoginAt = new Date();
//     await user.save();

//     // Generate token with shorter expiration for admin
//     const token = jwt.sign(
//       { userId: user._id, role: user.role, adminRole: adminRole.role },
//       process.env.JWT_SECRET || "your-secret-key",
//       { expiresIn: "8h" } // Shorter session for admin
//     );

//     // Remove password from response
//     const userResponse = user.toObject();
//     delete userResponse.password;

//     res.json({
//       message: "Admin login successful",
//       token,
//       user: userResponse,
//       adminRole: {
//         role: adminRole.role,
//         permissions: adminRole.permissions,
//         lastLogin: adminRole.lastLogin,
//       },
//     });
//   } catch (error) {
//     console.error("Admin login error:", error);
//     res.status(500).json({ message: "Server error during admin login" });
//   }
// });

// // Get admin profile
// router.get("/profile", authMiddleware, async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const adminRole = await AdminRole.findOne({ user: req.user._id });

//     res.json({
//       user: req.user,
//       adminRole: adminRole
//         ? {
//             role: adminRole.role,
//             permissions: adminRole.permissions,
//             lastLogin: adminRole.lastLogin,
//             loginAttempts: adminRole.loginAttempts,
//             isLocked: adminRole.isLocked(),
//           }
//         : null,
//     });
//   } catch (error) {
//     console.error("Get admin profile error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // Unlock admin account (super admin only)
// router.post("/unlock-admin", authMiddleware, async (req, res) => {
//   try {
//     const { adminUserId } = req.body;

//     // Check if current user is super admin
//     const currentAdminRole = await AdminRole.findOne({ user: req.user._id });
//     if (!currentAdminRole || currentAdminRole.role !== "super_admin") {
//       return res
//         .status(403)
//         .json({ message: "Only super admin can unlock admin accounts" });
//     }

//     // Find the admin user and role
//     const adminUser = await User.findById(adminUserId);
//     const adminRole = await AdminRole.findOne({ user: adminUserId });

//     if (!adminUser || !adminRole) {
//       return res.status(404).json({ message: "Admin user not found" });
//     }

//     // Reset login attempts for both user and admin role
//     await adminUser.resetLoginAttempts();
//     await adminRole.resetLoginAttempts();

//     res.json({ message: "Admin account unlocked successfully" });
//   } catch (error) {
//     console.error("Unlock admin account error:", error);
//     res.status(500).json({ message: "Server error unlocking admin account" });
//   }
// });

// // Create admin role (super admin only)
// router.post("/create-role", authMiddleware, async (req, res) => {
//   try {
//     const { userId, role, permissions } = req.body;

//     // Check if current user is super admin
//     const currentAdminRole = await AdminRole.findOne({ user: req.user._id });
//     if (!currentAdminRole || currentAdminRole.role !== "super_admin") {
//       return res
//         .status(403)
//         .json({ message: "Only super admin can create admin roles" });
//     }

//     // Check if user exists and is admin
//     const user = await User.findById(userId);
//     if (!user || user.role !== "admin") {
//       return res
//         .status(400)
//         .json({ message: "User not found or not an admin" });
//     }

//     // Check if admin role already exists
//     const existingRole = await AdminRole.findOne({ user: userId });
//     if (existingRole) {
//       return res
//         .status(400)
//         .json({ message: "Admin role already exists for this user" });
//     }

//     // Define default permissions based on role
//     let defaultPermissions = [];
//     switch (role) {
//       case "super_admin":
//         defaultPermissions = [
//           "view_users",
//           "edit_users",
//           "delete_users",
//           "view_transactions",
//           "process_transactions",
//           "view_reports",
//           "manage_merchants",
//           "system_settings",
//         ];
//         break;
//       case "view_admin_1":
//       case "view_admin_2":
//         defaultPermissions = [
//           "view_users",
//           "view_transactions",
//           "view_reports",
//         ];
//         break;
//     }

//     const adminRole = new AdminRole({
//       user: userId,
//       role,
//       permissions: permissions || defaultPermissions,
//     });

//     await adminRole.save();

//     res.status(201).json({
//       message: "Admin role created successfully",
//       adminRole,
//     });
//   } catch (error) {
//     console.error("Create admin role error:", error);
//     res.status(500).json({ message: "Server error creating admin role" });
//   }
// });

// module.exports = router;
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AdminRole = require('../models/AdminRole');
const authMiddleware = require('../middleware/auth');
const bcrypt=require('bcryptjs')

const router = express.Router();

// Admin login with enhanced security
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    // Check admin role
    const adminRole = await AdminRole.findOne({ user: user._id });
    if (!adminRole || !adminRole.isActive) {
      return res.status(403).json({ message: 'Admin access not configured' });
    }

    // Check if admin role is locked
    // if (adminRole.isLocked()) {
    //   const remainingTime = Math.ceil((adminRole.lockedUntil - Date.now()) / (60 * 1000));
    //   return res.status(423).json({ 
    //     message: `Admin account is locked due to multiple failed login attempts. Please try again in ${remainingTime} minutes.`,
    //     remainingMinutes: remainingTime
    //   });
    // }

    // Check if user account is locked
    // if (user.isLocked()) {
    //   const remainingTime = user.getRemainingLockoutTime();
    //   return res.status(423).json({ 
    //     message: `Account is locked due to multiple failed login attempts. Please try again in ${remainingTime} minutes.`,
    //     remainingMinutes: remainingTime
    //   });
    // }

    // Check password
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch) {
    //   // Increment login attempts for both user and admin role
    //   await user.incLoginAttempts();
    //   await adminRole.incLoginAttempts();
      
      // Check if accounts are now locked
      const updatedUser = await User.findById(user._id);
      const updatedAdminRole = await AdminRole.findById(adminRole._id);
      
      // if (updatedUser.isLocked() || updatedAdminRole.isLocked()) {
      //   const userRemainingTime = updatedUser.getRemainingLockoutTime();
      //   const adminRemainingTime = updatedAdminRole.isLocked() ? 
      //     Math.ceil((updatedAdminRole.lockedUntil - Date.now()) / (60 * 1000)) : 0;
      //   const maxRemainingTime = Math.max(userRemainingTime, adminRemainingTime);
        
      //   return res.status(423).json({ 
      //     message: `Too many failed login attempts. Admin account is now locked for ${maxRemainingTime} minutes.`,
      //     remainingMinutes: maxRemainingTime
      //   });
      // }
      
      // const userAttemptsLeft = user.maxLoginAttempts - (user.loginAttempts + 1);
      // const adminAttemptsLeft = 5 - (adminRole.loginAttempts + 1);
      // const minAttemptsLeft = Math.min(userAttemptsLeft, adminAttemptsLeft);
      
    //   return res.status(400).json({ 
    //     message: `Invalid admin credentials. ${minAttemptsLeft} attempts remaining before account lockout.`,
    //     attemptsRemaining: minAttemptsLeft
    //   });
    // }

    // // Reset login attempts on successful login
    // if (user.loginAttempts > 0) {
    //   await user.resetLoginAttempts();
    // }
    // if (adminRole.loginAttempts > 0) {
    //   await adminRole.resetLoginAttempts();
    // }
    
    // Update last login
    adminRole.lastLogin = new Date();
    await adminRole.save();

    user.lastLoginAt = new Date();
    await user.save();

    // Generate token with shorter expiration for admin
    const token = jwt.sign(
      { userId: user._id, role: user.role, adminRole: adminRole.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' } // Shorter session for admin
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Admin login successful',
      token,
      user: userResponse,
      adminRole: {
        role: adminRole.role,
        permissions: adminRole.permissions,
        lastLogin: adminRole.lastLogin
      }
    });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Get admin profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const adminRole = await AdminRole.findOne({ user: req.user._id });
    
    res.json({
      user: req.user,
      adminRole: adminRole ? {
        role: adminRole.role,
        permissions: adminRole.permissions,
        lastLogin: adminRole.lastLogin
        // loginAttempts: adminRole.loginAttempts,
        // isLocked: adminRole.isLocked()
      } : null
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlock admin account (super admin only)
// router.post('/unlock-admin', authMiddleware, async (req, res) => {
//   try {
//     const { adminUserId } = req.body;

//     // Check if current user is super admin
//     const currentAdminRole = await AdminRole.findOne({ user: req.user._id });
//     if (!currentAdminRole || currentAdminRole.role !== 'super_admin') {
//       return res.status(403).json({ message: 'Only super admin can unlock admin accounts' });
//     }

//     // Find the admin user and role
//     const adminUser = await User.findById(adminUserId);
//     const adminRole = await AdminRole.findOne({ user: adminUserId });

//     if (!adminUser || !adminRole) {
//       return res.status(404).json({ message: 'Admin user not found' });
//     }

//     // Reset login attempts for both user and admin role
//     await adminUser.resetLoginAttempts();
//     await adminRole.resetLoginAttempts();

//     res.json({ message: 'Admin account unlocked successfully' });
//   } catch (error) {
//     console.error('Unlock admin account error:', error);
//     res.status(500).json({ message: 'Server error unlocking admin account' });
//   }
// });

// Create admin role (super admin only)
router.post('/create-role', authMiddleware, async (req, res) => {
  try {
    const { userId, role, permissions } = req.body;

    // Check if current user is super admin
    const currentAdminRole = await AdminRole.findOne({ user: req.user._id });
    if (!currentAdminRole || currentAdminRole.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admin can create admin roles' });
    }

    // Check if user exists and is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'User not found or not an admin' });
    }

    // Check if admin role already exists
    const existingRole = await AdminRole.findOne({ user: userId });
    if (existingRole) {
      return res.status(400).json({ message: 'Admin role already exists for this user' });
    }

    // Define default permissions based on role
    let defaultPermissions = [];
    switch (role) {
      case 'super_admin':
        defaultPermissions = [
          'view_users', 'edit_users', 'delete_users',
          'view_transactions', 'process_transactions',
          'view_reports', 'manage_merchants', 'system_settings'
        ];
        break;
      case 'view_admin_1':
      case 'view_admin_2':
        defaultPermissions = ['view_users', 'view_transactions', 'view_reports'];
        break;
    }

    const adminRole = new AdminRole({
      user: userId,
      role,
      permissions: permissions || defaultPermissions
    });

    await adminRole.save();

    res.status(201).json({
      message: 'Admin role created successfully',
      adminRole
    });
  } catch (error) {
    console.error('Create admin role error:', error);
    res.status(500).json({ message: 'Server error creating admin role' });
  }
});

module.exports = router;

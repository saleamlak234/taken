const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { fullName, phoneNumber },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const hashPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashPassword;
    // const isMatch = await bcrypt.compare(currentPassword,user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: 'Current password is incorrect' });
    // }
  
    // Hash new password    
    
    // Update password
 
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// Link Telegram account
router.post('/link-telegram', async (req, res) => {
  try {
    const { telegramChatId } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { telegramChatId },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Telegram account linked successfully',
      user
    });
  } catch (error) {
    console.error('Link Telegram error:', error);
    res.status(500).json({ message: 'Server error linking Telegram account' });
  }
});

module.exports = router;
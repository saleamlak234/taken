const express = require('express');
const WithdrawalSchedule = require('../models/WithdrawalSchedule');
const TransactionHistory = require('../models/TransactionHistory');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const cron = require('node-cron');

const router = express.Router();

// Check if current time is within withdrawal window (4 AM - 11 AM)
function isWithdrawalTimeAllowed() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 4 && hour < 11;
}

// Schedule a withdrawal
router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;
    const userId = req.user._id;

    // Check if withdrawal time is allowed
    if (!isWithdrawalTimeAllowed()) {
      return res.status(400).json({ 
        message: 'Withdrawals can only be scheduled between 4:00 AM and 11:00 AM' 
      });
    }

    // Validate amount
    if (amount < 1000) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is 1000 ETB' });
    }

    if (amount > req.user.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check if user already has a pending withdrawal for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingWithdrawal = await WithdrawalSchedule.findOne({
      user: userId,
      scheduledDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'processing'] }
    });

    if (existingWithdrawal) {
      return res.status(400).json({ 
        message: 'You already have a pending withdrawal for today' 
      });
    }

    // Create withdrawal schedule
    const withdrawal = new WithdrawalSchedule({
      user: userId,
      amount,
      scheduledDate: new Date(),
      paymentMethod,
      accountDetails
    });

    await withdrawal.save();

    // Deduct amount from user balance
    await User.findByIdAndUpdate(userId, {
      $inc: { balance: -amount }
    });

    // Create transaction history record
    const transaction = new TransactionHistory({
      user: userId,
      transactionType: 'withdrawal',
      amount,
      status: 'processing',
      description: `Scheduled withdrawal via ${paymentMethod}`,
      metadata: {
        withdrawalScheduleId: withdrawal._id,
        paymentMethod,
        accountDetails
      }
    });

    await transaction.save();

    res.status(201).json({
      message: 'Withdrawal scheduled successfully',
      withdrawal,
      transaction
    });
  } catch (error) {
    console.error('Schedule withdrawal error:', error);
    res.status(500).json({ message: 'Server error scheduling withdrawal' });
  }
});

// Get user's scheduled withdrawals
router.get('/my-schedules', authMiddleware, async (req, res) => {
  try {
    const withdrawals = await WithdrawalSchedule.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ withdrawals });
  } catch (error) {
    console.error('Get scheduled withdrawals error:', error);
    res.status(500).json({ message: 'Server error fetching scheduled withdrawals' });
  }
});

// Cancel scheduled withdrawal (only if not yet processing)
router.delete('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    const withdrawal = await WithdrawalSchedule.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal schedule not found' });
    }

    if (withdrawal.status !== 'scheduled') {
      return res.status(400).json({ 
        message: 'Cannot cancel withdrawal that is already processing' 
      });
    }

    // Return amount to user balance
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: withdrawal.amount }
    });

    // Update withdrawal status
    withdrawal.status = 'cancelled';
    await withdrawal.save();

    // Update transaction history
    await TransactionHistory.findOneAndUpdate(
      { 'metadata.withdrawalScheduleId': withdrawal._id },
      { status: 'cancelled' }
    );

    res.json({ message: 'Withdrawal cancelled successfully' });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({ message: 'Server error cancelling withdrawal' });
  }
});

// Cron job to process daily withdrawals (runs at 4 AM every day)
cron.schedule('0 4 * * *', async () => {
  console.log('Starting daily withdrawal processing...');
  await processDailyWithdrawals();
});

async function processDailyWithdrawals() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scheduledWithdrawals = await WithdrawalSchedule.find({
      scheduledDate: { $gte: today, $lt: tomorrow },
      status: 'scheduled'
    }).populate('user');

    for (const withdrawal of scheduledWithdrawals) {
      try {
        // Update withdrawal status to processing
        withdrawal.status = 'processing';
        await withdrawal.save();

        // Update transaction history
        await TransactionHistory.findOneAndUpdate(
          { 'metadata.withdrawalScheduleId': withdrawal._id },
          { status: 'processing' }
        );

        console.log(`Processing withdrawal ${withdrawal._id} for user ${withdrawal.user.fullName}`);
        
        // Here you would integrate with actual payment processing
        // For now, we'll mark as completed after a delay
        setTimeout(async () => {
          try {
            withdrawal.status = 'completed';
            withdrawal.processedAt = new Date();
            await withdrawal.save();

            await TransactionHistory.findOneAndUpdate(
              { 'metadata.withdrawalScheduleId': withdrawal._id },
              { 
                status: 'completed',
                processedAt: new Date()
              }
            );

            await User.findByIdAndUpdate(withdrawal.user._id, {
              $inc: { totalWithdrawals: withdrawal.amount }
            });

            console.log(`Completed withdrawal ${withdrawal._id}`);
          } catch (error) {
            console.error(`Error completing withdrawal ${withdrawal._id}:`, error);
            
            withdrawal.status = 'failed';
            withdrawal.failureReason = error.message;
            await withdrawal.save();

            await TransactionHistory.findOneAndUpdate(
              { 'metadata.withdrawalScheduleId': withdrawal._id },
              { 
                status: 'failed',
                rejectionReason: error.message
              }
            );

            // Return amount to user balance
            await User.findByIdAndUpdate(withdrawal.user._id, {
              $inc: { balance: withdrawal.amount }
            });
          }
        }, Math.random() * 30000); // Random delay up to 30 seconds

      } catch (error) {
        console.error(`Error processing withdrawal ${withdrawal._id}:`, error);
      }
    }

    console.log(`Processed ${scheduledWithdrawals.length} withdrawals`);
  } catch (error) {
    console.error('Daily withdrawal processing error:', error);
  }
}

module.exports = router;
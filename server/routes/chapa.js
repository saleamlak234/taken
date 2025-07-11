const express = require('express');
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const chapaService = require('../services/chapa');

const router = express.Router();

// Chapa payment callback
router.post('/callback', async (req, res) => {
  try {
    const { tx_ref, status, trx_ref } = req.body;

    console.log('Chapa callback received:', req.body);

    // Find deposit by reference
    const deposit = await Deposit.findOne({ chapaReference: tx_ref }).populate('user');
    
    if (!deposit) {
      console.error('Deposit not found for tx_ref:', tx_ref);
      return res.status(404).json({ message: 'Deposit not found' });
    }

    if (status === 'success') {
      // Verify payment with Chapa
      try {
        const verification = await chapaService.verifyPayment(trx_ref);
        
        if (verification.status === 'success' && verification.data.status === 'success') {
          // Update deposit status
          deposit.status = 'completed';
          deposit.chapaTransactionId = trx_ref;
          await deposit.save();

          // Process deposit approval
          await processDepositApproval(deposit);

          console.log('Payment verified and deposit approved:', deposit._id);
        } else {
          console.error('Payment verification failed:', verification);
          deposit.status = 'rejected';
          deposit.rejectionReason = 'Payment verification failed';
          await deposit.save();
        }
      } catch (verificationError) {
        console.error('Payment verification error:', verificationError);
        // Keep as pending for manual review
      }
    } else {
      // Payment failed
      deposit.status = 'rejected';
      deposit.rejectionReason = 'Payment failed';
      await deposit.save();
    }

    res.json({ message: 'Callback processed' });
  } catch (error) {
    console.error('Chapa callback error:', error);
    res.status(500).json({ message: 'Server error processing callback' });
  }
});

// Helper function to process deposit approval
async function processDepositApproval(deposit) {
  try {
    // Update user's total deposits
    await User.findByIdAndUpdate(deposit.user._id, {
      $inc: { totalDeposits: deposit.amount }
    });

    // Process commissions would go here
    // (Implementation similar to admin route)
  } catch (error) {
    console.error('Process deposit approval error:', error);
  }
}

module.exports = router;
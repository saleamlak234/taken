const cron = require('node-cron');
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const MonthlyEarning = require('../models/MonthlyEarning');
const Commission = require('../models/Commission');
const telegramService = require('../services/telegram');

// Run daily earnings job on the 1st of every month at 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily earnings job...');
  await processDailyEarnings();
});

// async function processDailyEarnings() {
//   try {
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1;
//     const currentYear = currentDate.getFullYear();

//     // Get all completed deposits
//     const completedDeposits = await Deposit.find({ status: 'completed' }).populate('user');

//     for (const deposit of completedDeposits) {
//       // Check if earnings already processed for this month
//       const existingEarning = await MonthlyEarning.findOne({
//         deposit: deposit._id,
//         month: currentMonth,
//         year: currentYear
//       });

//       if (existingEarning) {
//         continue; // Skip if already processed
//       }

//       // Calculate monthly return (20% of deposit amount)
//       const monthlyReturn = deposit.amount * 0.20;

//       // Create monthly earning record
//       const monthlyEarning = new MonthlyEarning({
//         user: deposit.user._id,
//         deposit: deposit._id,
//         amount: monthlyReturn,
//         month: currentMonth,
//         year: currentYear,
//         status: 'paid'
//       });

//       await monthlyEarning.save();

//       // Add to user balance
//       await User.findByIdAndUpdate(deposit.user._id, {
//         $inc: { balance: monthlyReturn }
//       });

//       // Process commissions for monthly earnings
//       await processMonthlyEarningCommissions(deposit, monthlyReturn);

//       // Send notification to user
//       if (deposit.user.telegramChatId) {
//         await telegramService.sendMessage(
//           deposit.user.telegramChatId,
//           `💰 Monthly Return Credited!\n\n` +
//           `Package: ${deposit.package}\n` +
//           `Amount: ${monthlyReturn.toLocaleString()} ETB\n` +
//           `Your balance has been updated.`
//         );
//       }

//       console.log(`Processed monthly earning for user ${deposit.user.fullName}: ${monthlyReturn} ETB`);
//     }

//     console.log('Monthly earnings job completed successfully');
//   } catch (error) {
//     console.error('Monthly earnings job error:', error);
//   }
// }

// async function processMonthlyEarningCommissions(deposit, earningAmount) {
//   try {
//     const user = await User.findById(deposit.user).populate('referredBy');
//     if (!user || !user.referredBy) return;

//     const commissionRates = [0.08, 0.04, 0.02, 0.01]; // 8%, 4%, 2%, 1%
//     let currentUser = user.referredBy;
//     let level = 1;

//     while (currentUser && level <= 4) {
//       const commissionAmount = earningAmount * commissionRates[level - 1];
      
//       // Create commission record
//       const commission = new Commission({
//         user: currentUser._id,
//         fromUser: deposit.user,
//         amount: commissionAmount,
//         level,
//         type: 'earning',
//         description: `Level ${level} commission from ${user.fullName}'s monthly earning`,
//         sourceTransaction: deposit._id,
//         sourceModel: 'MonthlyEarning'
//       });

//       await commission.save();

//       // Update user balance and commission total
//       await User.findByIdAndUpdate(currentUser._id, {
//         $inc: {
//           balance: commissionAmount,
//           totalCommissions: commissionAmount
//         }
//       });

//       // Send notification
//       if (currentUser.telegramChatId) {
//         await telegramService.sendMessage(
//           currentUser.telegramChatId,
//           `💰 Commission earned!\n` +
//           `Amount: ${commissionAmount.toLocaleString()} ETB\n` +
//           `Level: ${level}\n` +
//           `From: ${user.fullName}'s monthly earning`
//         );
//       }

//       // Move to next level
//       const nextUser = await User.findById(currentUser._id).populate('referredBy');
//       currentUser = nextUser?.referredBy;
//       level++;
//     }
//   } catch (error) {
//     console.error('Monthly earning commission processing error:', error);
//   }
// }

// // Export for manual testing
// module.exports = { processMonthlyEarnings };
async function processDailyEarnings() {
  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get all completed deposits
    const completedDeposits = await Deposit.find({
      status: "completed",
    }).populate("user");

    for (const deposit of completedDeposits) {
      // Check if earnings already processed for this day
      const existingEarning = await MonthlyEarning.findOne({
        // Keep the model name as MonthlyEarning
        deposit: deposit._id,
        day: currentDay,
        month: currentMonth,
        year: currentYear,
      });

      if (existingEarning) {
        continue; // Skip if already processed
      }

      // Calculate daily return (20% of deposit amount / 30 days)
      const dailyReturn = (deposit.amount * 0.2) / 30; // Assuming 30 days in a month

      // Create monthly earning record (still using the MonthlyEarning model)
      const dailyEarning = new MonthlyEarning({
        // Keep the model name as MonthlyEarning
        user: deposit.user._id,
        deposit: deposit._id,
        amount: dailyReturn,
        day: currentDay,
        month: currentMonth,
        year: currentYear,
        status: "paid",
      });

      await dailyEarning.save();

      // Add to user balance
      await User.findByIdAndUpdate(deposit.user._id, {
        $inc: { balance: dailyReturn },
      });

      // Process commissions for daily earnings
      await processMonthlyEarningCommissions(deposit, dailyReturn); // Keep the same commission function

      // Send notification to user
      if (deposit.user.telegramChatId) {
        await telegramService.sendMessage(
          deposit.user.telegramChatId,
          `💰 Daily Return Credited!\n\n` +
            `Package: ${deposit.package}\n` +
            `Amount: ${dailyReturn.toLocaleString()} ETB\n` +
            `Your balance has been updated.`
        );
      }

      console.log(
        `Processed daily earning for user ${deposit.user.fullName}: ${dailyReturn} ETB`
      );
    }

    console.log("Daily earnings job completed successfully");
  } catch (error) {
    console.error("Daily earnings job error:", error);
  }
}
module.exports = { processDailyEarnings };
// const TelegramBot = require('node-telegram-bot-api');

// class TelegramService {
//   constructor() {
//     this.token = process.env.TELEGRAM_BOT_TOKEN || 'your-telegram-bot-token';
//     this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || 'admin-chat-id';
    
//     if (this.token && this.token !== 'your-telegram-bot-token') {
//       this.bot = new TelegramBot(this.token, { polling: false });
//     } else {
//       console.warn('Telegram bot token not configured');
//       this.bot = null;
//     }
//   }

//   async sendMessage(chatId, message) {
//     if (!this.bot) {
//       console.log('Telegram message (bot not configured):', message);
//       return;
//     }

//     try {
//       await this.bot.sendMessage(chatId, message);
//     } catch (error) {
//       console.error('Telegram send message error:', error);
//     }
//   }

//   async sendToAdmin(message) {
//     if (!this.adminChatId || this.adminChatId === 'admin-chat-id') {
//       console.log('Admin Telegram message:', message);
//       return;
//     }

//     await this.sendMessage(this.adminChatId, message);
//   }

//   async sendWelcomeMessage(chatId, userFullName, referralCode) {
//     const message = `
// 🎉 Welcome to Saham Trading, ${userFullName}!

// Your account has been created successfully.

// 📋 Your Referral Code: ${referralCode}

// 💰 Investment Packages:
// • Full Stock Package: 70,000 ETB (20% monthly return)
// • Half Stock Package: 35,000 ETB (20% monthly return)
// • Quarter Stock Package: 17,500 ETB (20% monthly return)
// • Minimum Stock Package: 7,000 ETB (20% monthly return)

// 🤝 MLM Commission Structure:
// • Level 1: 8% commission
// • Level 2: 4% commission
// • Level 3: 2% commission
// • Level 4: 1% commission

// Start your investment journey today!
//     `;

//     await this.sendMessage(chatId, message);
//   }

//   async sendDepositNotification(chatId, amount, packageName, status) {
//     const statusEmoji = status === 'completed' ? '✅' : status === 'rejected' ? '❌' : '⏳';
//     const message = `
// ${statusEmoji} Deposit Update

// Package: ${packageName}
// Amount: ${amount.toLocaleString()} ETB
// Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

// ${status === 'completed' ? 'Your investment is now active!' : 
//   status === 'rejected' ? 'Please contact support for assistance.' : 
//   'Your deposit is being processed.'}
//     `;

//     await this.sendMessage(chatId, message);
//   }

//   async sendCommissionNotification(chatId, amount, level, fromUser) {
//     const message = `
// 💰 Commission Earned!

// Amount: ${amount.toLocaleString()} ETB
// Level: ${level}
// From: ${fromUser}

// Your commission has been added to your balance.
//     `;

//     await this.sendMessage(chatId, message);
//   }

//   async sendWithdrawalNotification(chatId, amount, status, rejectionReason = null) {
//     const statusEmoji = status === 'completed' ? '✅' : status === 'rejected' ? '❌' : '⏳';
//     let message = `
// ${statusEmoji} Withdrawal Update

// Amount: ${amount.toLocaleString()} ETB
// Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
//     `;

//     if (status === 'rejected' && rejectionReason) {
//       message += `\nReason: ${rejectionReason}`;
//     }

//     await this.sendMessage(chatId, message);
//   }
// }

// module.exports = new TelegramService();
const TelegramBot = require("node-telegram-bot-api");

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!this.token) {
      console.warn("Telegram bot token not configured");
      this.bot = null;
      return;
    }

    try {
      this.bot = new TelegramBot(this.token, { polling: true }); // Enable polling

      this.bot.on("message", (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Echo the message back to the user
        this.bot.sendMessage(chatId, `You said: ${text}`);

        // Example: Send to admin if the message contains a keyword
        if (text.includes("urgent")) {
          this.sendToAdmin(`Urgent message from user ${chatId}: ${text}`);
        }
      });

      console.log("Telegram bot started");
    } catch (error) {
      console.error("Error starting Telegram bot:", error);
      this.bot = null;
    }
  }

  async sendMessage(chatId, message) {
    if (!this.bot) {
      console.log("Telegram message (bot not configured):", message);
      return;
    }

    try {
      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Telegram send message error:", error);
    }
  }

  async sendToAdmin(message) {
    if (!this.adminChatId) {
      console.log("Admin Telegram message:", message);
      return;
    }

    await this.sendMessage(this.adminChatId, message);
  }

  async sendWelcomeMessage(chatId, userFullName, referralCode) {
    const message = `
🎉 Welcome to Saham Trading, ${userFullName}!

Your account has been created successfully.

📋 Your Referral Code: ${referralCode}

💰 Investment Packages:
• Full Stock Package: 70,000 ETB (20% monthly return)
• Half Stock Package: 35,000 ETB (20% monthly return)
• Quarter Stock Package: 17,500 ETB (20% monthly return)
• Minimum Stock Package: 7,000 ETB (20% monthly return)

🤝 MLM Commission Structure:
• Level 1: 8% commission
• Level 2: 4% commission
• Level 3: 2% commission
• Level 4: 1% commission

Start your investment journey today!
    `;

    await this.sendMessage(chatId, message);
  }

  async sendDepositNotification(chatId, amount, packageName, status) {
    const statusEmoji =
      status === "completed" ? "✅" : status === "rejected" ? "❌" : "⏳";
    const message = `
${statusEmoji} Deposit Update

Package: ${packageName}
Amount: ${amount.toLocaleString()} ETB
Status: ${status.charAt(0).toUpperCase() + status.slice(1)}

${
  status === "completed"
    ? "Your investment is now active!"
    : status === "rejected"
    ? "Please contact support for assistance."
    : "Your deposit is being processed."
}
    `;

    await this.sendMessage(chatId, message);
  }

  async sendCommissionNotification(chatId, amount, level, fromUser) {
    const message = `
💰 Commission Earned!

Amount: ${amount.toLocaleString()} ETB
Level: ${level}
From: ${fromUser}

Your commission has been added to your balance.
    `;

    await this.sendMessage(chatId, message);
  }

  async sendWithdrawalNotification(
    chatId,
    amount,
    status,
    rejectionReason = null
  ) {
    const statusEmoji =
      status === "completed" ? "✅" : status === "rejected" ? "❌" : "⏳";
    let message = `
${statusEmoji} Withdrawal Update

Amount: ${amount.toLocaleString()} ETB
Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
    `;

    if (status === "rejected" && rejectionReason) {
      message += `\nReason: ${rejectionReason}`;
    }

    await this.sendMessage(chatId, message);
  }
}

module.exports = new TelegramService();

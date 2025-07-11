const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const dotenv = require("dotenv");
const AdminRole = require("../models/AdminRole");
const MerchantAccount = require("../models/MerchantAccount");
const QRCode = require("qrcode");
require("dotenv").config();

async function completeSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await AdminRole.deleteMany({});
    await MerchantAccount.deleteMany({});
    console.log("🧹 Cleared existing data");

    // Create only one Super Admin
    const superAdminPassword = await bcrypt.hash("superadmin123", 10);
    const superAdmin = new User({
      fullName: "Minyichl Belay",
      email: "minyichlbelay3@gmail.com",
      phoneNumber: "+251929343646",
      password: 'minychil123',
      role: "admin",
      referralCode: "SUPERADMIN",
      isActive: true,
      balance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalCommissions: 0,
      level: 1,
      directReferrals: 0,
      totalTeamSize: 0,
    });
    await superAdmin.save();

    // Create Super Admin Role
    const superAdminRole = new AdminRole({
      user: superAdmin._id,
      role: "super_admin",
      permissions: [
        "view_users",
        "edit_users",
        "delete_users",
        "view_transactions",
        "process_transactions",
        "view_reports",
        "manage_merchants",
        "system_settings",
      ],
      isActive: true,
    });
    await superAdminRole.save();
       const viewAdmin1Password = await bcrypt.hash('admin123', 10);
        const viewAdmin1 = new User({
          fullName: 'Derejaw Betseha',
          email: 'derejawbetseha916@gmail.com',
          phoneNumber: '+251998458102',
          password: 'admin123',
          role: 'admin',
          referralCode: 'VIEWADMIN1',
          isActive: true,
          balance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalCommissions: 0,
          level: 1,
          directReferrals: 0,
          totalTeamSize: 0
        });
        await viewAdmin1.save();
    
        // Create View Admin 1 Role
        const viewAdmin1Role = new AdminRole({
          user: viewAdmin1._id,
          role: 'view_admin_1',
          permissions: ['view_users', 'view_transactions', 'view_reports'],
          isActive: true
        });
        await viewAdmin1Role.save();

    // Create Sample Regular Users
    // const sampleUsers = [
    //   {
    //     fullName: "John Doe",
    //     email: "john@example.com",
    //     phoneNumber: "+251911111111",
    //     password: "password123",
    //     referralCode: "JOHN001",
    //   },
    //   {
    //     fullName: "Jane Smith",
    //     email: "jane@example.com",
    //     phoneNumber: "+251911111112",
    //     password: "password123",
    //     referralCode: "JANE001",
    //   },
    //   {
    //     fullName: "Bob Johnson",
    //     email: "bob@example.com",
    //     phoneNumber: "+251911111113",
    //     password: "password123",
    //     referralCode: "BOB001",
    //   },
    // ];

    // for (const userData of sampleUsers) {
    //   const hashedPassword = await bcrypt.hash(userData.password, 10);
    //   const user = new User({
    //     ...userData,
    //     password: hashedPassword,
    //     role: "user",
    //     isActive: true,
    //     balance: Math.floor(Math.random() * 50000),
    //     totalDeposits: Math.floor(Math.random() * 100000),
    //     totalWithdrawals: Math.floor(Math.random() * 20000),
    //     totalCommissions: Math.floor(Math.random() * 15000),
    //     level: Math.floor(Math.random() * 4) + 1,
    //     directReferrals: Math.floor(Math.random() * 10),
    //     totalTeamSize: Math.floor(Math.random() * 50),
    //   });
    //   await user.save();
    //   console.log(`👤 Sample user created: ${user.email}`);
    // }

    // Create Merchant Accounts with QR Codes
    const merchants = [
      {
        bankName: "Commercial Bank of Ethiopia (CBE)",
        accountNumber: "1000703059598",
        accountHolder: "minyichl belay",
        branch: "Addis Ababa Main Branch",
        description: "Primary merchant account for deposits",
      },
      {
        bankName: "Commercial Bank of Ethiopia (CBE)",
        accountNumber: "1000634860002",
        accountHolder: "Saham Trading Secondary",
        branch: "Bole Branch",
        description: "Secondary merchant account for high volume",
      },
      {
        bankName: "Dashen Bank",
        accountNumber: "0123456789012",
        accountHolder: "Saham Trading Dashen",
        branch: "Merkato Branch",
        description: "Alternative banking option",
      },
      {
        bankName: "Bank of Abyssinia",
        accountNumber: "9876543210987",
        accountHolder: "Saham Trading BOA",
        branch: "Piassa Branch",
        description: "Additional merchant account",
      },
    ];

    for (const merchantData of merchants) {
      // Generate QR Code
      const qrData = {
        bankName: merchantData.bankName,
        accountNumber: merchantData.accountNumber,
        accountHolder: merchantData.accountHolder,
        branch: merchantData.branch,
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

      const merchant = new MerchantAccount({
        ...merchantData,
        qrCode: qrCodeDataURL,
        isActive: true,
        dailyLimit: 1000000, // 1M ETB daily limit
        currentDailyAmount: 0,
      });

      await merchant.save();
      console.log(
        `🏦 Merchant account created: ${merchant.bankName} - ${merchant.accountNumber}`
      );
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 ADMIN LOGIN CREDENTIALS:");
    console.log("================================");
   
    console.log("   Permissions: Full system access");
    

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

completeSeed();

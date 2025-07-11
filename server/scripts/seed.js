// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// require('dotenv').config();

// async function seedDatabase() {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saham-trading');
//     console.log('Connected to MongoDB');

//     // Clear existing users
//     await User.deleteMany({});
//     console.log('Cleared existing users');

//     // Create admin user
//     const adminPassword = await bcrypt.hash('admin123', 10);
//     const admin = new User({
//       fullName: 'Admin User',
//       email: 'admin@sahamtrading.com',
//       phoneNumber: '+251911000000',
//       password: adminPassword,
//       role: 'admin',
//       referralCode: 'ADMIN001',
//       isActive: true,
//       balance: 0,
//       totalDeposits: 0,
//       totalWithdrawals: 0,
//       totalCommissions: 0,
//       level: 1,
//       directReferrals: 0,
//       totalTeamSize: 0
//     });

//     await admin.save();
//     console.log('Admin user created:', admin.email);

//     // Create sample users
//     const sampleUsers = [
//       {
//         fullName: 'John Doe',
//         email: 'john@example.com',
//         phoneNumber: '+251911111111',
//         password: 'password123',
//         referralCode: 'JOHN001'
//       },
//       {
//         fullName: 'Jane Smith',
//         email: 'jane@example.com',
//         phoneNumber: '+251911111112',
//         password: 'password123',
//         referralCode: 'JANE001'
//       },
//       {
//         fullName: 'Bob Johnson',
//         email: 'bob@example.com',
//         phoneNumber: '+251911111113',
//         password: 'password123',
//         referralCode: 'BOB001'
//       }
//     ];

//     for (const userData of sampleUsers) {
//       const hashedPassword = await bcrypt.hash(userData.password, 10);
//       const user = new User({
//         ...userData,
//         password: hashedPassword,
//         role: 'user',
//         isActive: true,
//         balance: Math.floor(Math.random() * 50000),
//         totalDeposits: Math.floor(Math.random() * 100000),
//         totalWithdrawals: Math.floor(Math.random() * 20000),
//         totalCommissions: Math.floor(Math.random() * 15000),
//         level: Math.floor(Math.random() * 4) + 1,
//         directReferrals: Math.floor(Math.random() * 10),
//         totalTeamSize: Math.floor(Math.random() * 50)
//       });

//       await user.save();
//       console.log('Sample user created:', user.email);
//     }

//     console.log('Database seeded successfully!');
//     console.log('\nLogin credentials:');
//     console.log('Admin: admin@sahamtrading.com / admin123');
//     console.log('User: john@example.com / password123');
    
//     process.exit(0);
//   } catch (error) {
//     console.error('Seed error:', error);
//     process.exit(1);
//   }
// }

// seedDatabase();
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../src/models/User');
const Inquiry = require('../src/models/Inquiry');
const Reel = require('../src/models/Reel');

async function seedDemoCustomer() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let customer = await User.findOne({ email: 'customer.demo@bizreels.in' });
    if (!customer) {
      customer = await User.create({
        name: 'Rajesh Sarkar',
        email: 'customer.demo@bizreels.in',
        phone: '+9198027544778',
        roles: ['customer'],
        activeRole: 'customer',
        isVerified: true,
      });
      console.log('Created demo customer user:', customer._id);
    }

    const vendor = await User.findOne({ email: 'vendor.demo@bizreels.in' }) || await User.findOne({ _id: { $ne: customer._id } });
    const reel = await Reel.findOne({ isDeleted: { $ne: true } });

    if (vendor && reel) {
      const inqCount = await Inquiry.countDocuments({ customer: customer._id });
      if (inqCount === 0) {
        const inq = await Inquiry.create({
          customer: customer._id,
          vendor: vendor._id,
          reel: reel._id,
          message: 'Hi! I am interested in this product reel. Could you share price and availability?',
          status: 'sent',
        });
        console.log(`Created sample inquiry for demo customer ID: ${inq._id}`);
      }
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding demo customer:', err);
    process.exit(1);
  }
}

seedDemoCustomer();

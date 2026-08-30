const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const Reel = require('../src/models/Reel');
const Inquiry = require('../src/models/Inquiry');

async function testInquiriesFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const customer = await User.findOne({ activeRole: 'customer' }).lean() || await User.findOne().lean();
    const vendor = await User.findOne({ _id: { $ne: customer._id } }).lean();
    const reel = await Reel.findOne({ isDeleted: { $ne: true } }).lean();

    if (!customer || !vendor) {
      console.log('Missing customer or vendor user');
      mongoose.disconnect();
      return;
    }

    console.log(`Creating test inquiry from Customer ${customer._id} to Vendor ${vendor._id}...`);
    const inq = await Inquiry.create({
      customer: customer._id,
      vendor: vendor._id,
      reel: reel?._id || null,
      message: 'Hello, I am interested in your reel product! Please send quote.',
      status: 'sent',
    });
    console.log(`✅ Test Inquiry Created ID: ${inq._id}`);

    // Query inquiries for Customer
    const customerInquiries = await Inquiry.find({ customer: customer._id, isDeleted: { $ne: true } })
      .populate('vendor', 'name businessName shopName avatarUrl profile_pic')
      .populate('reel', 'caption videoUrl thumbnailUrl')
      .lean();

    console.log(`✅ Customer ${customer._id} has ${customerInquiries.length} inquiry/inquiries in DB:`);
    customerInquiries.forEach(i => {
      console.log(`  - ID: ${i._id} | Vendor: "${i.vendor?.shopName || i.vendor?.name}" | Message: "${i.message}" | Status: ${i.status}`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error('Error testing inquiries flow:', err);
    process.exit(1);
  }
}

testInquiriesFlow();

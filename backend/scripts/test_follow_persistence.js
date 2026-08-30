const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../src/models/User');
const followService = require('../src/services/follow.service');

async function testFollowPersistence() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const customer = await User.findOne({ email: 'customer.demo@bizreels.in' }) || await User.findOne().lean();
    const vendor = await User.findOne({ email: 'vendor.demo@bizreels.in' }) || await User.findOne({ _id: { $ne: customer._id } }).lean();

    if (!customer || !vendor) {
      console.log('Missing customer or vendor user for test.');
      mongoose.disconnect();
      return;
    }

    console.log(`Testing follow: Customer ${customer._id} -> Vendor ${vendor._id}...`);
    await followService.follow(customer._id.toString(), vendor._id.toString());

    // Verify isFollowing persistence
    const isFollowed = await followService.isFollowing(customer._id.toString(), vendor._id.toString());
    console.log(`✅ Follow Status Check after DB update: isFollowing = ${isFollowed}`);

    // Verify followingIds list
    const followedIds = await followService.followingIds(customer._id.toString());
    console.log(`✅ Customer Following IDs list contains Vendor ID: ${followedIds.includes(vendor._id.toString())}`);

    if (isFollowed && followedIds.includes(vendor._id.toString())) {
      console.log('🎉 FOLLOW PERSISTENCE TEST PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ Follow persistence check failed.');
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('Error testing follow persistence:', err);
    process.exit(1);
  }
}

testFollowPersistence();

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const feedService = require('../src/services/feed.service');

async function testFeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Testing feed.service buildFeed()...');

    const feed = await feedService.buildFeed({ limit: 10, type: 'all' });
    console.log(`=== FEED RESULT ITEMS (${feed.items.length}) ===`);
    feed.items.forEach((item, idx) => {
      console.log(`[${idx + 1}] Type: ${item.postType} | Title: "${(item.title || item.caption || '').substring(0, 30)}..." | Price: ₹${item.price} | TaggedProduct: "${item.taggedListing ? item.taggedListing.title : 'None'}"`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error('Error testing feed:', err);
    process.exit(1);
  }
}

testFeed();

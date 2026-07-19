const Listing = require('../models/Listing');
const Reel = require('../models/Reel');
const Requirement = require('../models/Requirement');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Seed Database with Initial Production-grade Data if collections are empty.
 */
const seedDatabaseIfEmpty = async () => {
  try {
    // 1. Seed System / Demo User
    let demoUser = await User.findOne({ email: 'demo@bizreels.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'BizReels Official Store',
        email: 'demo@bizreels.com',
        phone: '+91 98200 11223',
        roles: ['vendor', 'creator', 'customer'],
        current_role: 'vendor',
        city: 'Mumbai',
        walletBalance: 25000,
        creatorProfile: {
          name: 'Rohan Media',
          bio: 'Fashion & Lifestyle Content Creator with 100k+ reach',
          city: 'Mumbai',
          languages: 'English, Hindi',
          experienceYears: 4,
          travelAvailable: true,
          availability: 'Available',
          pricing: { reel1: 500, reel3: 1200, reel10: 3500, hourlyRate: 1000, dayRate: 6000 }
        },
        vendorProfile: {
          shopName: 'Trends Fashion Store',
          category: 'Fashion & Apparel',
          city: 'Mumbai',
          isClosed: false
        }
      });
      logger.info('Demo user created', { service: 'seeder' });
    }

    const userId = demoUser._id.toString();

    // 2. Seed Listings if empty
    const listingCount = await Listing.countDocuments();
    if (listingCount === 0) {
      await Listing.insertMany([
        {
          vendor: demoUser._id,
          type: 'product',
          title: 'Sony Bravia 55" 4K Smart OLED TV',
          description: 'Top grade 4K OLED TV with Dolby Vision and Google TV UI',
          category: 'Electronics',
          subcategory: 'Televisions',
          price: 64990,
          condition: 'new',
          images: ['https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80'],
          rating: 4.8,
          totalReviews: 24,
          location: { address: 'Sony Center Bandra, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
          isBoosted: true
        },
        {
          vendor: demoUser._id,
          type: 'service',
          title: 'Professional Home Deep Cleaning Service',
          description: 'Complete home chemical wash, sofa vacuuming, and kitchen degreasing',
          category: 'Services',
          subcategory: 'Cleaning',
          price: 3499,
          images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80'],
          rating: 4.9,
          totalReviews: 18,
          location: { address: 'Urban Clean Express, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' }
        },
        {
          vendor: demoUser._id,
          type: 'product',
          title: 'Ergonomic Mesh Office Chair with Lumbar Support',
          description: 'High-back ergonomic mesh chair with adjustable headrest and 3D armrests',
          category: 'Furniture',
          subcategory: 'Office Chairs',
          price: 8999,
          condition: 'new',
          images: ['https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=600&q=80'],
          rating: 4.6,
          totalReviews: 12,
          location: { address: 'Featherlite Depot, Delhi', city: 'Delhi', state: 'Delhi', pincode: '110001' }
        }
      ]);
      logger.info('Listings seeded to MongoDB', { service: 'seeder' });
    }

    // 3. Seed Reels if empty
    const reelCount = await Reel.countDocuments();
    if (reelCount === 0) {
      await Reel.insertMany([
        {
          creator: demoUser._id,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-neon-room-41566-large.mp4',
          caption: '🔥 Hot New Summer Fashion Collection at Trends Boutique! #fashion #style',
          hashtags: ['fashion', 'style', 'summer'],
          location: { address: 'Bandra West, Mumbai' },
          views: 45200,
          likesCount: 1420,
          commentsCount: 89,
          isBoosted: true
        },
        {
          creator: demoUser._id,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-green-screen-41548-large.mp4',
          caption: '⚡ Up to 40% Off on Latest Smartphone Repairs & Accessories! Visit iTech Care today.',
          hashtags: ['tech', 'gadgets', 'mumbai'],
          location: { address: 'CP, New Delhi' },
          views: 28900,
          likesCount: 980,
          commentsCount: 34,
          isBoosted: false
        }
      ]);
      logger.info('Reels seeded to MongoDB', { service: 'seeder' });
    }

    // 4. Seed Requirements if empty
    const reqCount = await Requirement.countDocuments();
    if (reqCount === 0) {
      await Requirement.insertMany([
        {
          customer_id: userId,
          title: 'Bulk Order: 10 Gaming Laptops i7 16GB RAM',
          description: 'Need 10 brand new laptops for software agency setup with fast delivery',
          category_id: 'Electronics',
          budget_min: 500000,
          budget_max: 750000,
          location: { area: 'Bandra', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
          urgency: 'this_week',
          status: 'open',
          proposals_count: 3
        },
        {
          customer_id: userId,
          title: 'Full House Interior Designing & Woodwork',
          description: 'Looking for verified interior designers for 3BHK flat in Andheri West',
          category_id: 'Services',
          budget_min: 300000,
          budget_max: 450000,
          location: { area: 'Andheri', city: 'Mumbai', state: 'Maharashtra', pincode: '400053' },
          urgency: 'this_month',
          status: 'open',
          proposals_count: 5
        }
      ]);
      logger.info('Requirements seeded to MongoDB', { service: 'seeder' });
    }

    // 5. Seed Orders if empty
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      await Order.insertMany([
        {
          customer_id: userId,
          vendor_id: userId,
          items: [{ title: 'Sony Bravia 55" OLED TV', quantity: 1, unit_price: 64990 }],
          total_price: 64990,
          payment_status: 'paid',
          status: 'accepted'
        },
        {
          customer_id: userId,
          vendor_id: userId,
          items: [{ title: 'Ergonomic Office Chair', quantity: 2, unit_price: 8999 }],
          total_price: 17998,
          payment_status: 'paid',
          status: 'completed'
        }
      ]);
      logger.info('Orders seeded to MongoDB', { service: 'seeder' });
    }

    // 6. Seed Inquiries if empty
    const inquiryCount = await Inquiry.countDocuments();
    if (inquiryCount === 0) {
      await Inquiry.insertMany([
        {
          customer: demoUser._id,
          vendor: demoUser._id,
          item: 'Sony 55" OLED TV',
          message: 'Interested in instant delivery to Bandra West.',
          status: 'Replied'
        },
        {
          customer: demoUser._id,
          vendor: demoUser._id,
          item: 'AC Repair Service',
          message: 'Need gas refilling for 2 split AC units tomorrow.',
          status: 'Pending'
        }
      ]);
      logger.info('Inquiries seeded to MongoDB', { service: 'seeder' });
    }

    // 7. Seed Reviews if empty
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.insertMany([
        {
          reviewer_id: userId,
          target_type: 'vendor',
          target_id: userId,
          rating: 5,
          comment: 'Excellent Sony OLED TV! Delivery was super fast within 2 hours in Bandra.',
          reply: 'Thank you Aakash! Enjoy your new OLED TV!'
        },
        {
          reviewer_id: userId,
          target_type: 'vendor',
          target_id: userId,
          rating: 4,
          comment: 'Great collection of summer wear. Quality is top notch.',
          reply: ''
        }
      ]);
      logger.info('Reviews seeded to MongoDB', { service: 'seeder' });
    }

    // 8. Seed Notifications if empty
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.insertMany([
        {
          user_id: userId,
          type: 'system',
          title: 'System Announcement',
          body: 'BizReels Platform Upgrade: New AI Reel Generator is now active for vendors & creators!',
          is_read: false
        },
        {
          user_id: userId,
          type: 'vendor',
          title: 'Vendor Reply',
          body: 'Trends Fashion Store replied to your inquiry: "Yes, size M is available in stock!"',
          is_read: false
        },
        {
          user_id: userId,
          type: 'price',
          title: 'Price Drop Alert! 🎉',
          body: 'Sony Bravia OLED TV 55" price dropped by ₹5,000 in your saved list!',
          is_read: true
        }
      ]);
      logger.info('Notifications seeded to MongoDB', { service: 'seeder' });
    }

    // 9. Seed Wallet Transactions if empty
    const walletTxCount = await WalletTransaction.countDocuments();
    if (walletTxCount === 0) {
      await WalletTransaction.insertMany([
        {
          user: demoUser._id,
          amount: 5000,
          type: 'credit',
          description: 'Wallet Top Up via UPI',
          status: 'success'
        },
        {
          user: demoUser._id,
          amount: 1499,
          type: 'debit',
          description: 'Reel Boost Purchase (Gold)',
          status: 'success'
        }
      ]);
      logger.info('Wallet transactions seeded to MongoDB', { service: 'seeder' });
    }
  } catch (err) {
    logger.error('Error during auto-seeding:', { error: err.message, service: 'seeder' });
  }
};

module.exports = { seedDatabaseIfEmpty };

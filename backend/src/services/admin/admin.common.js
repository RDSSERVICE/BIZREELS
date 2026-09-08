const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../utils/logger');

const runInTransaction = async (operation) => {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (e) {
    logger.warn('Failed to start session. MongoDB might be running in standalone mode without replica set. Executing without transaction.');
    return await operation(null);
  }

  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortError) {
      logger.error('Failed to abort transaction:', abortError);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    let startIndex = uploadIndex + 1;
    if (parts[startIndex].match(/^v\d+$/)) {
      startIndex += 1;
    }
    
    const publicIdWithExt = parts.slice(startIndex).join('/');
    const dotIndex = publicIdWithExt.lastIndexOf('.');
    if (dotIndex !== -1) {
      return publicIdWithExt.substring(0, dotIndex);
    }
    return publicIdWithExt;
  } catch (e) {
    return null;
  }
};

const deleteMediaFile = async (url) => {
  if (!url || typeof url !== 'string') return;
  
  if (url.includes('cloudinary.com')) {
    const publicId = extractPublicId(url);
    if (publicId) {
      const isVideo = url.includes('/video/') || url.match(/\.(mp4|mov|avi|webm|mkv)$/i);
      const resourceType = isVideo ? 'video' : 'image';
      try {
        const cloudinaryService = require('../cloudinary.service');
        await cloudinaryService.destroy(publicId, resourceType);
      } catch (err) {
        logger.error(`Error deleting Cloudinary file ${publicId}:`, err);
      }
    }
    return;
  }
  
  if (url.startsWith('/api/uploads/') || url.startsWith('/uploads/')) {
    try {
      const relativePath = url.replace(/^\/api\//, '');
      const absolutePath = path.resolve(__dirname, '..', '..', '..', relativePath);
      await fs.unlink(absolutePath);
    } catch (err) {
      // Ignore if file doesn't exist
    }
  }
};

const recalculateUserRating = async (userId, session) => {
  try {
    const Review = mongoose.model('Review');
    const User = mongoose.model('User');
    
    const userStats = await Review.aggregate([
      { $match: { targetUser: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      {
        $group: {
          _id: '$targetUser',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).session(session);

    const targetUserDoc = await User.findById(userId).session(session);
    if (targetUserDoc) {
      const avgRating = userStats.length > 0 ? Math.round(userStats[0].avgRating * 10) / 10 : 0;
      const totalReviews = userStats.length > 0 ? userStats[0].totalReviews : 0;

      targetUserDoc.rating_avg = avgRating;
      targetUserDoc.rating_count = totalReviews;

      if (targetUserDoc.roles.includes('vendor') && targetUserDoc.vendorProfile) {
        targetUserDoc.vendorProfile.rating = avgRating;
        targetUserDoc.vendorProfile.totalReviews = totalReviews;
      }
      if (targetUserDoc.roles.includes('creator') && targetUserDoc.creatorProfile) {
        targetUserDoc.creatorProfile.rating = avgRating;
        targetUserDoc.creatorProfile.totalReviews = totalReviews;
      }
      targetUserDoc.markModified('vendorProfile');
      targetUserDoc.markModified('creatorProfile');
      await targetUserDoc.save({ session });
    }
  } catch (err) {
    logger.error(`Error recalculating user rating for ${userId}:`, err);
  }
};

const recalculateListingRating = async (listingId, session) => {
  try {
    const Review = mongoose.model('Review');
    const Listing = mongoose.model('Listing');
    
    const listingStats = await Review.aggregate([
      { $match: { targetListing: new mongoose.Types.ObjectId(listingId), isDeleted: false } },
      {
        $group: {
          _id: '$targetListing',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]).session(session);

    if (listingStats.length > 0) {
      await Listing.findByIdAndUpdate(listingId, {
        rating: Math.round(listingStats[0].avgRating * 10) / 10,
        totalReviews: listingStats[0].totalReviews,
      }, { session });
    } else {
      await Listing.findByIdAndUpdate(listingId, {
        rating: 0,
        totalReviews: 0,
      }, { session });
    }
  } catch (err) {
    logger.error(`Error recalculating listing rating for ${listingId}:`, err);
  }
};

const cleanBaseUserAccount = async (userId, mediaUrlsToDelete, session) => {
  const User = mongoose.model('User');
  const Wallet = mongoose.model('Wallet');
  const KycDocument = mongoose.model('KycDocument');
  const RefreshToken = mongoose.model('RefreshToken');
  const Follow = mongoose.model('Follow');
  const SearchHistory = mongoose.model('SearchHistory');
  const Notification = mongoose.model('Notification');

  // Delete Wallet
  await Wallet.deleteOne({ user_id: userId }).session(session);

  // Delete KYC Documents and extract their file URLs
  const kycDocs = await KycDocument.find({ user_id: userId }).session(session);
  for (const doc of kycDocs) {
    if (doc.doc_url) mediaUrlsToDelete.push(doc.doc_url);
    if (doc.selfie_url) mediaUrlsToDelete.push(doc.selfie_url);
  }
  await KycDocument.deleteMany({ user_id: userId }).session(session);

  // Delete RefreshTokens
  await RefreshToken.deleteMany({ userId: new mongoose.Types.ObjectId(userId) }).session(session);

  // Delete Follows and update count of followed/following users
  const followerDocs = await Follow.find({ follower_id: userId }).session(session);
  const followingDocs = await Follow.find({ following_id: userId }).session(session);

  await Follow.deleteMany({ $or: [{ follower_id: userId }, { following_id: userId }] }).session(session);

  // Pull from followers array and decrement followersCount for users this user followed
  for (const fd of followerDocs) {
    const followeeId = fd.following_id;
    await User.updateOne(
      { _id: followeeId },
      { 
        $pull: { followers: new mongoose.Types.ObjectId(userId) }, 
        $inc: { followersCount: -1 } 
      }
    ).session(session);
  }

  // Pull from following array and decrement followingCount for users that followed this user
  for (const fd of followingDocs) {
    const followerId = fd.follower_id;
    await User.updateOne(
      { _id: followerId },
      { 
        $pull: { following: new mongoose.Types.ObjectId(userId) }, 
        $inc: { followingCount: -1 } 
      }
    ).session(session);
  }

  // Delete SearchHistory, Notifications
  await SearchHistory.deleteMany({ user_id: userId }).session(session);
  await Notification.deleteMany({ recipient: { $in: [userId, new mongoose.Types.ObjectId(userId)] } }).session(session);

  // Delete base User document
  await User.deleteOne({ _id: userId }).session(session);
};

module.exports = {
  runInTransaction,
  extractPublicId,
  deleteMediaFile,
  recalculateUserRating,
  recalculateListingRating,
  cleanBaseUserAccount,
};

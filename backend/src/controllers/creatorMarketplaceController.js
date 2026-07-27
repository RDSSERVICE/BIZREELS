const User = require('../models/User');
const Reel = require('../models/Reel');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const Campaign = require('../models/Campaign');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

class CreatorMarketplaceController {
  // ── Discover Creators ────────────────────────────────────
  discover = asyncHandler(async (req, res) => {
    const {
      search,
      city,
      category,
      rating,
      minPrice,
      maxPrice,
      minFollowers,
      experience,
      languages,
      availability,
      verifiedOnly,
      recentlyActive,
      sortBy = 'highest_rated',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      $or: [
        { roles: 'creator' },
        { current_role: 'creator' },
        { creatorProfile: { $ne: null } }
      ],
      is_deleted: { $ne: true },
      is_banned: { $ne: true },
    };

    // Filter out current logged in user from list
    const currentUserId = req.user?._id;
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    // Text Search
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { 'creatorProfile.name': searchRegex },
        { 'creatorProfile.bio': searchRegex },
        { 'creatorProfile.category': searchRegex },
        { 'creatorProfile.skills': searchRegex },
        { 'creatorProfile.languages': searchRegex },
      ];
    }

    // City Filter
    if (city && city !== 'all' && city !== 'All Cities') {
      query.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    // Category Filter
    if (category && category !== 'all' && category !== 'All Categories') {
      query.$or = [
        { 'creatorProfile.category': new RegExp(category.trim(), 'i') },
        { occupation: new RegExp(category.trim(), 'i') },
      ];
    }

    // Rating Filter
    if (rating && parseFloat(rating) > 0) {
      query.rating_avg = { $gte: parseFloat(rating) };
    }

    // Pricing Budget range
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      query.$or = [
        { 'creatorProfile.pricing.reel1': priceFilter },
        { pricing: priceFilter } // fallback
      ];
    }

    // Followers Filter
    if (minFollowers && parseInt(minFollowers, 10) > 0) {
      query.followersCount = { $gte: parseInt(minFollowers, 10) };
    }

    // Experience Filter
    if (experience && experience.trim() !== '') {
      query.$or = [
        { 'creatorProfile.experienceYears': new RegExp(experience.trim(), 'i') },
        { 'creatorProfile.experience': new RegExp(experience.trim(), 'i') },
      ];
    }

    // Languages Filter
    if (languages && languages.trim() !== '') {
      const langArr = languages.split(',').map((l) => l.trim()).filter(Boolean);
      if (langArr.length > 0) {
        query['creatorProfile.languages'] = {
          $in: langArr.map((lang) => new RegExp(lang, 'i')),
        };
      }
    }

    // Availability Filter
    if (availability && availability !== 'all') {
      if (availability === 'available') {
        query['creatorProfile.availability'] = { $ne: 'busy' };
      } else {
        query['creatorProfile.availability'] = new RegExp(availability, 'i');
      }
    }

    // Verified Badge Only
    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.$or = [
        { kyc_status: 'approved' },
        { is_subscribed_verified: true },
      ];
    }

    // Recently Active (logged in last 7 days)
    if (recentlyActive === 'true' || recentlyActive === true) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.lastLoginAt = { $gte: sevenDaysAgo };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skipNum = (pageNum - 1) * limitNum;

    // Aggregation pipeline to resolve count of Reels and Completed Campaigns
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'reels',
          let: { creatorId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$creator', '$$creatorId'] }, isDeleted: { $ne: true } } }
          ],
          as: 'reelsList'
        }
      },
      {
        $lookup: {
          from: 'campaigns',
          let: { creatorId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$creator', '$$creatorId'] }, status: 'completed' } }
          ],
          as: 'campaignsList'
        }
      },
      {
        $addFields: {
          totalReelsCount: { $size: '$reelsList' },
          totalCampaignsCount: { $size: '$campaignsList' }
        }
      }
    ];

    // Sorting Stage
    let sortStage = {};
    if (sortBy === 'highest_rated') {
      sortStage = { rating_avg: -1, createdAt: -1 };
    } else if (sortBy === 'price_low_high') {
      sortStage = { 'creatorProfile.pricing.reel1': 1, rating_avg: -1 };
    } else if (sortBy === 'price_high_low') {
      sortStage = { 'creatorProfile.pricing.reel1': -1, rating_avg: -1 };
    } else if (sortBy === 'most_followers') {
      sortStage = { followersCount: -1, rating_avg: -1 };
    } else if (sortBy === 'most_reels') {
      sortStage = { totalReelsCount: -1, rating_avg: -1 };
    } else if (sortBy === 'most_campaigns') {
      sortStage = { totalCampaignsCount: -1, rating_avg: -1 };
    } else if (sortBy === 'recently_joined') {
      sortStage = { createdAt: -1 };
    } else if (sortBy === 'recently_active') {
      sortStage = { lastLoginAt: -1, rating_avg: -1 };
    } else {
      sortStage = { rating_avg: -1 };
    }

    pipeline.push({ $sort: sortStage });

    // Pagination Stage using Facet
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skipNum }, { $limit: limitNum }]
      }
    });

    const result = await User.aggregate(pipeline);
    const facetData = result[0] || { metadata: [], data: [] };
    const total = facetData.metadata[0]?.total || 0;
    const rawCreators = facetData.data;

    // Serialize and enrich the creators details
    const creators = rawCreators.map((c) => {
      const profile = c.creatorProfile || {};
      const pricing = profile.pricing || {};

      return {
        _id: c._id.toString(),
        id: c._id.toString(),
        name: profile.name || c.name || 'Verified Creator',
        username: profile.username || c.email?.split('@')[0] || `creator_${c._id.toString().slice(-6)}`,
        profile_pic: c.profile_pic || c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        avatarUrl: c.profile_pic || c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        city: c.city || 'Mumbai',
        state: profile.state || c.location?.state || 'Maharashtra',
        country: profile.country || c.location?.country || 'India',
        category: profile.category || c.occupation || 'Visual Creator',
        bio: profile.bio || 'Verified short-form commercial reel creator on BizReels.',
        rating_avg: c.rating_avg || 5.0,
        rating_count: c.rating_count || 0,
        followersCount: c.followersCount || 0,
        followingCount: c.followingCount || 0,
        isVerified: c.kyc_status === 'approved' || c.is_subscribed_verified,
        pricing: {
          reel1: pricing.reel1 || 800,
          reel3: pricing.reel3 || 2000,
        },
        languages: profile.languages || 'English, Hindi',
        experience: profile.experienceYears || '2 Years',
        responseTime: c.avg_response_time_seconds
          ? `${Math.round(c.avg_response_time_seconds / 3600)} Hours`
          : '2 Hours',
        lastActiveStatus: c.lastLoginAt ? 'Recently Active' : 'Offline',
        availabilityStatus: profile.availability || 'Available',
        totalReels: c.totalReelsCount || 0,
        totalCampaigns: c.totalCampaignsCount || 0,
      };
    });

    return ApiResponse.paginated(res, 'Creators matching filters fetched.', creators, {
      page: pageNum,
      limit: limitNum,
      total,
    });
  });

  // ── Get Distinct Cities ──────────────────────────────────
  getCities = asyncHandler(async (req, res) => {
    const list = await User.distinct('city', {
      $or: [
        { roles: 'creator' },
        { current_role: 'creator' },
        { creatorProfile: { $ne: null } }
      ],
      is_deleted: { $ne: true },
      city: { $ne: null, $ne: '' }
    });
    return ApiResponse.ok(res, 'Distinct creator cities loaded.', list);
  });

  // ── Get Distinct Categories ──────────────────────────────
  getCategories = asyncHandler(async (req, res) => {
    const list = await User.distinct('creatorProfile.category', {
      $or: [
        { roles: 'creator' },
        { current_role: 'creator' },
        { creatorProfile: { $ne: null } }
      ],
      is_deleted: { $ne: true },
      'creatorProfile.category': { $ne: null, $ne: '' }
    });
    // Add default fallbacks if database distinct list is empty
    const items = list.length > 0 ? list : ['Fashion', 'Electronics', 'Furniture', 'Restaurant', 'Beauty', 'Fitness', 'Automotive', 'Travel'];
    return ApiResponse.ok(res, 'Distinct creator categories loaded.', items);
  });

  // ── Get Creator Marketplace Profile ──────────────────────
  getCreatorProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest('Invalid creator ID.');
    }

    const creator = await User.findOne({
      _id: id,
      $or: [
        { roles: 'creator' },
        { current_role: 'creator' },
        { creatorProfile: { $ne: null } }
      ],
      is_deleted: { $ne: true }
    });
    if (!creator) {
      throw ApiError.notFound('Creator profile not found.');
    }

    const cp = creator.creatorProfile || {};
    const pricing = cp.pricing || {};

    // Fetch related Reels
    const reels = await Reel.find({ creator: id, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch related listings / images
    const listings = await Listing.find({ vendor: id, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch reviews left for this creator
    const reviews = await Review.find({ targetUser: id })
      .populate('author', 'name profile_pic avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate dynamic stats
    const totalReelsCount = reels.length;
    const totalViews = reels.reduce((acc, r) => acc + (r.views || 0), 0);
    const totalLikes = reels.reduce((acc, r) => acc + (r.likesCount || 0), 0);
    const totalCampaignsCount = await Campaign.countDocuments({ creator: id, status: 'completed' });

    const formattedProfile = {
      _id: creator._id.toString(),
      id: creator._id.toString(),
      name: cp.name || creator.name || 'Verified Creator',
      username: cp.username || creator.email?.split('@')[0] || `creator_${creator._id.toString().slice(-6)}`,
      profile_pic: creator.profile_pic || creator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      avatarUrl: creator.profile_pic || creator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      coverImage: cp.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bio: cp.bio || 'Professional short-form commercial video reel creator on BizReels.',
      category: cp.category || creator.occupation || 'Visual Creator',
      skills: cp.skills || ['Video Shoot', 'Editing', 'Brand Promotion'],
      languages: cp.languages || 'English, Hindi',
      experience: cp.experienceYears || '2 Years',
      contactInfo: {
        email: cp.email || creator.email || '',
        phone: cp.mobileNumber || creator.phone || '',
      },
      socialLinks: cp.socialLinks || {
        instagram: `https://instagram.com/${cp.username || 'bizreels'}`,
        youtube: 'https://youtube.com',
        tiktok: 'https://tiktok.com',
      },
      isVerified: creator.kyc_status === 'approved' || creator.is_subscribed_verified,
      rating_avg: creator.rating_avg || 5.0,
      rating_count: creator.rating_count || 0,
      followersCount: creator.followersCount || 0,
      followingCount: creator.followingCount || 0,
      totalReels: totalReelsCount,
      totalViews,
      totalLikes,
      campaignsCompleted: totalCampaignsCount,
      reels: reels.map((r) => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        caption: r.caption || '',
        views: r.views || 0,
        likes: r.likesCount || 0,
        comments: r.commentsCount || 0,
        shares: r.sharesCount || 0,
        duration: r.duration || '15s',
        uploadDate: r.createdAt,
      })),
      portfolioImages: listings.map((l) => ({
        id: l._id.toString(),
        _id: l._id.toString(),
        title: l.title,
        url: l.images?.[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
      })),
      reviews: reviews.map((rev) => ({
        _id: rev._id.toString(),
        id: rev._id.toString(),
        rating: rev.rating,
        comment: rev.comment || '',
        createdAt: rev.createdAt,
        author: {
          name: rev.author?.name || 'Anonymous Client',
          avatarUrl: rev.author?.profile_pic || rev.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        },
      })),
      pricing: {
        reel1: pricing.reel1 || 800,
        reel3: pricing.reel3 || 2000,
        reel10: pricing.reel10 || 5000,
      },
      availabilityStatus: cp.availability || 'Available',
    };

    return ApiResponse.ok(res, 'Creator profile loaded successfully.', formattedProfile);
  });
}

module.exports = new CreatorMarketplaceController();

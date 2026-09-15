const express = require('express');
const creatorController = require('../controllers/creatorController');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { catchAsync } = require('../utils/helpers');

const router = express.Router();

const creatorVerificationController = require('../controllers/creatorVerification.controller');

// ── CREATOR VERIFICATION ENDPOINTS ────────────────────────────

router.get(['/me/verification-status', '/me/verification'], authenticate, creatorVerificationController.getVerificationStatus);
router.post(['/me/send-contact-otp', '/me/verification/send-otp'], authenticate, creatorVerificationController.sendContactOtp);
router.post(['/me/verify-contact', '/me/verification/verify-contact'], authenticate, creatorVerificationController.verifyContact);
router.post(['/me/verify-document', '/me/verification/document'], authenticate, creatorVerificationController.verifyDocument);
router.post(['/me/verify-payment', '/me/verification/payment'], authenticate, creatorVerificationController.verifyPayment);

// Dedicated Sandbox API Verification Endpoints
router.post('/me/verification/pan', authenticate, creatorVerificationController.verifyPan);
router.post('/me/verification/aadhaar/initiate', authenticate, creatorVerificationController.initiateAadhaar);
router.post('/me/verification/aadhaar/verify-otp', authenticate, creatorVerificationController.verifyAadhaarOtp);
router.post('/me/verification/bank', authenticate, creatorVerificationController.verifyBank);
router.post('/me/verification/upi', authenticate, creatorVerificationController.verifyUpi);

/**
 * Creator Studio Routes — /api/v1/creator
 */

router.get('/dashboard', authenticate, creatorController.getDashboard);

router.get('/portfolio', authenticate, creatorController.getPortfolio);
router.post('/portfolio/reels', authenticate, creatorController.addPortfolioReel);
router.post('/portfolio/images', authenticate, creatorController.addPortfolioImage);
router.delete('/portfolio/:type/:id', authenticate, creatorController.deletePortfolioItem);

router.get('/pricing', authenticate, creatorController.getPricing);
router.patch('/pricing', authenticate, creatorController.updatePricing);

router.get('/availability', authenticate, creatorController.getAvailability);
router.patch('/availability', authenticate, creatorController.updateAvailability);

router.get('/orders', authenticate, creatorController.getOrders);
router.patch('/orders/:id/status', authenticate, creatorController.updateOrderStatus);

module.exports = router;


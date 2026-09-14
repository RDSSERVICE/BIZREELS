/**
 * Bidding System Utilities — Section 11 Specification
 * Final Bid = MIN(Quoted Price * 0.002, 20 Credits)
 * Minimum bid fee is 0.10 Credits.
 */

export const BID_MULTIPLIER = 0.002;
export const BID_CAP_CREDITS = 20;
export const MIN_BID_FEE = 0.10;

/**
 * Calculates bid credit cost based on Section 11 of the requirements specification:
 * Final Bid = MIN(Quoted Price * 0.002, 20 Credits)
 * Minimum fee is 0.10 Credits.
 *
 * @param {number|string} price - Quoted price or budget in INR
 * @returns {number} Required credits to submit proposal
 */
export const calculateBidCreditCost = (price) => {
  const num = Number(price);
  if (!num || isNaN(num) || num <= 0) return MIN_BID_FEE;
  return Math.min(Math.max(MIN_BID_FEE, Number((num * BID_MULTIPLIER).toFixed(2))), BID_CAP_CREDITS);
};

const axios = require('axios');

class SandboxVerificationService {
  constructor() {
    this.baseUrl = process.env.SANDBOX_BASE_URL || 'https://api.sandbox.co.in';
    this.apiKey = process.env.SANDBOX_API_KEY || process.env.API_KEY || process.env['API Key'] || '';
    this.apiSecret = process.env.SANDBOX_API_SECRET || process.env.API_SECRET || process.env['API Secret'] || '';
    
    // In-memory token cache (valid for ~24h, refresh at 23h)
    this.cachedToken = null;
    this.tokenExpiryTime = null;
  }

  /**
   * Helper to mask Aadhaar number: "XXXX XXXX 1234"
   */
  maskAadhaar(aadhaar) {
    if (!aadhaar) return '';
    const clean = String(aadhaar).replace(/\D/g, '');
    if (clean.length < 4) return 'XXXX XXXX XXXX';
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  }

  /**
   * Helper to mask Bank Account: "XXXXXX1234"
   */
  maskBankAccount(acc) {
    if (!acc) return '';
    const clean = String(acc).trim();
    if (clean.length <= 4) return 'XXXX' + clean;
    const last4 = clean.slice(-4);
    return 'X'.repeat(Math.max(4, clean.length - 4)) + last4;
  }

  /**
   * Helper to mask PAN number: "ABCDE****F"
   */
  maskPan(pan) {
    if (!pan || pan.length !== 10) return pan || '';
    return pan.slice(0, 5) + '****' + pan.slice(9);
  }

  /**
   * Generates or retrieves a valid cached JWT from Sandbox Authenticate API
   */
  async getAccessToken() {
    // Check if cached token is still valid (with 5 min safety buffer)
    const now = Date.now();
    if (this.cachedToken && this.tokenExpiryTime && now < this.tokenExpiryTime - 5 * 60 * 1000) {
      return this.cachedToken;
    }

    if (!this.apiKey || !this.apiSecret) {
      console.warn('[Sandbox] API Key or Secret is missing in environment configuration.');
      throw new Error('Sandbox API credentials are not configured on server.');
    }

    try {
      const authUrl = `${this.baseUrl}/authenticate`;
      const response = await axios.post(
        authUrl,
        {},
        {
          headers: {
            'x-api-key': this.apiKey,
            'x-api-secret': this.apiSecret,
            'x-api-version': '1.0.0',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const data = response.data?.data || response.data;
      const token = data?.access_token || response.data?.access_token || response.data?.token;

      if (!token) {
        throw new Error('Failed to obtain access token from Sandbox Authenticate API.');
      }

      this.cachedToken = token;
      // Tokens are typically valid for 24 hours. Cache for 23 hours.
      this.tokenExpiryTime = now + 23 * 60 * 60 * 1000;
      return token;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      console.error('[Sandbox Auth Error]:', errorMsg);
      throw new Error(`Sandbox authentication failed: ${errorMsg}`);
    }
  }

  /**
   * Make an authenticated request to Sandbox API
   */
  async request(method, path, data = null, params = null, customHeaders = {}) {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers = {
      'Authorization': token,
      'x-api-key': this.apiKey,
      'x-api-version': '1.0.0',
      'Content-Type': 'application/json',
      ...customHeaders
    };

    try {
      const res = await axios({
        method,
        url,
        data: data || undefined,
        params: params || undefined,
        headers,
        timeout: 15000
      });
      return res.data;
    } catch (err) {
      // If token expired (401), invalidate cache and retry once
      if (err.response?.status === 401 && this.cachedToken) {
        this.cachedToken = null;
        this.tokenExpiryTime = null;
        const freshToken = await this.getAccessToken();
        headers['Authorization'] = freshToken;
        const retryRes = await axios({
          method,
          url,
          data: data || undefined,
          params: params || undefined,
          headers,
          timeout: 15000
        });
        return retryRes.data;
      }

      const status = err.response?.status;
      const resData = err.response?.data;
      const errorMsg = resData?.message || resData?.error?.message || err.message;

      const safeError = new Error(errorMsg);
      safeError.status = status;
      safeError.raw = resData;
      throw safeError;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. PAN VERIFICATION
  // ─────────────────────────────────────────────────────────────
  async verifyPan(panNumber) {
    const pan = String(panNumber || '').trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        message: 'Invalid PAN format. Must be 10 alphanumeric characters (e.g. ABCDE1234F).'
      };
    }

    try {
      // Sandbox PAN verification endpoint
      let res;
      try {
        res = await this.request('POST', '/kyc/pan/verify', {
          '@entity': 'in.co.sandbox.kyc.pan_verification.request',
          pan: pan,
          consent: 'Y',
          reason: 'Vendor KYC Onboarding'
        });
      } catch (e1) {
        res = await this.request('POST', '/kyc/pan', {
          '@entity': 'in.co.sandbox.kyc.pan_verification.request',
          pan: pan,
          consent: 'Y',
          reason: 'Vendor KYC Onboarding'
        });
      }

      const data = res.data || res;
      const panStatus = (data.status || data.pan_status || '').toUpperCase();
      const isPanValid = panStatus === 'VALID' || panStatus === 'ACTIVE' || data.verified === true;

      const fullName = data.full_name || data.name || data.pan_holder_name || '';

      return {
        success: true,
        verified: isPanValid,
        status: isPanValid ? 'approved' : 'failed',
        panNumber: pan,
        maskedNumber: this.maskPan(pan),
        fullName: fullName,
        panStatus: panStatus || 'VALID',
        category: data.category || 'Individual',
        referenceId: data.reference_id || res.transaction_id || `PAN_${Date.now()}`,
        verifiedAt: new Date()
      };
    } catch (err) {
      console.error('[Sandbox PAN Verification Error]:', err.message);
      return {
        success: false,
        verified: false,
        status: 'failed',
        message: err.message || 'PAN verification failed. Please check the PAN number.'
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AADHAAR OKYC (OTP-BASED)
  // ─────────────────────────────────────────────────────────────
  async initiateAadhaarOtp(aadhaarNumber) {
    const cleanAadhaar = String(aadhaarNumber || '').replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      return {
        success: false,
        message: 'Invalid Aadhaar number. Must be exactly 12 digits.'
      };
    }

    try {
      const res = await this.request('POST', '/kyc/aadhaar/okyc/otp', {
        '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
        aadhaar_number: cleanAadhaar,
        consent: 'Y',
        reason: 'Vendor Identity Verification'
      });

      const data = res.data || res;
      const innerData = data.data || data;
      const refId = innerData.reference_id || innerData.ref_id || innerData.referenceId || data.reference_id || data.ref_id || data.referenceId;

      return {
        success: true,
        referenceId: refId,
        maskedAadhaar: this.maskAadhaar(cleanAadhaar),
        message: data.message || innerData.message || 'Aadhaar OTP sent successfully to your registered mobile number.',
        validity: innerData.validity || data.validity || 600
      };
    } catch (err) {
      const errorMsg = err.message || '';
      console.error('[Sandbox Aadhaar OTP Initiate Error]:', errorMsg);

      let friendlyMsg = errorMsg;
      if (errorMsg.toLowerCase().includes('source unavailable')) {
        friendlyMsg = 'Aadhaar verification service (UIDAI) is temporarily busy. Please try sending OTP again in a few moments, or upload your Aadhaar document card images below.';
      } else if (!friendlyMsg) {
        friendlyMsg = 'Failed to initiate Aadhaar OTP. Please check the Aadhaar number and try again.';
      }

      return {
        success: false,
        message: friendlyMsg
      };
    }
  }

  async verifyAadhaarOtp(referenceId, otp) {
    if (!referenceId || !otp) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        message: 'Reference ID and OTP are required.'
      };
    }

    const cleanOtp = String(otp).trim();

    try {
      const res = await this.request('POST', '/kyc/aadhaar/okyc/otp/verify', {
        '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
        reference_id: referenceId,
        otp: cleanOtp
      });

      const data = res.data || res;
      const innerData = data.data || data;
      const isVerified = data.status === 'VALID' || data.status === 'SUCCESS' || innerData.status === 'VALID' || innerData.status === 'SUCCESS' || !!innerData.name || !!innerData.full_name || res.code === 200;

      return {
        success: true,
        verified: isVerified,
        status: isVerified ? 'approved' : 'failed',
        referenceId: referenceId,
        fullName: innerData.name || innerData.full_name || data.full_name || '',
        gender: innerData.gender || data.gender || '',
        dob: innerData.dob || data.dob || '',
        maskedNumber: innerData.aadhaar_number ? this.maskAadhaar(innerData.aadhaar_number) : (innerData.masked_aadhaar_number || this.maskAadhaar(cleanOtp)),
        message: innerData.message || data.message || (isVerified ? 'Aadhaar verified successfully!' : 'Aadhaar OTP verification failed'),
        verifiedAt: new Date()
      };
    } catch (err) {
      console.error('[Sandbox Aadhaar OTP Verify Error]:', err.message);

      return {
        success: false,
        verified: false,
        status: 'failed',
        message: err.message || 'Invalid or expired Aadhaar OTP code. Please check and try again.'
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. GSTIN VERIFICATION
  // ─────────────────────────────────────────────────────────────
  async verifyGstin(gstinNumber) {
    const gstin = String(gstinNumber || '').trim().toUpperCase();
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        message: 'Invalid GSTIN format (e.g. 27ABCDE1234F1Z5).'
      };
    }

    try {
      let res;
      try {
        res = await this.request('POST', '/gst/compliance/public/gstin/search', {
          gstin: gstin
        });
      } catch (e1) {
        try {
          res = await this.request('POST', '/gst/compliance/public/gstin/verify', {
            gstin: gstin
          });
        } catch (e2) {
          res = await this.request('GET', `/gsp/public/gstin/${gstin}`);
        }
      }


      const data = res.data || res;
      const legalName = data.legal_name || data.lgnm || data.trade_name_of_business || data.trade_name || '';
      const tradeName = data.trade_name || data.trade_name_of_business || legalName;
      const gstStatus = (data.status || data.sts || 'Active').toUpperCase();
      const isActive = gstStatus === 'ACTIVE';

      return {
        success: true,
        verified: isActive,
        status: isActive ? 'approved' : 'failed',
        gstin: gstin,
        legalName: legalName,
        tradeName: tradeName,
        gstStatus: gstStatus,
        state: data.state || data.pradr?.addr?.stcd || '',
        centerJurisdiction: data.ctj || data.jurisdiction || '',
        referenceId: data.reference_id || `GST_${Date.now()}`,
        verifiedAt: new Date()
      };
    } catch (err) {
      console.error('[Sandbox GSTIN Verification Error]:', err.message);
      return {
        success: false,
        verified: false,
        status: 'failed',
        message: err.message || 'GSTIN verification failed. Please check the GSTIN number.'
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. BANK ACCOUNT VERIFICATION
  // ─────────────────────────────────────────────────────────────
  async verifyBankAccount(ifsc, accountNumber, accountHolderName = '') {
    const cleanIfsc = String(ifsc || '').trim().toUpperCase();
    const cleanAcc = String(accountNumber || '').trim();

    if (!cleanIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        message: 'Invalid IFSC code format.'
      };
    }

    if (!cleanAcc || cleanAcc.length < 8 || cleanAcc.length > 20) {
      return {
        success: false,
        verified: false,
        status: 'failed',
        message: 'Invalid bank account number length.'
      };
    }

    try {
      const res = await this.request('GET', `/bank/${cleanIfsc}/accounts/${cleanAcc}/verify`, null, {
        name: accountHolderName || undefined
      });

      const data = res.data || res;
      const accountExists = data.account_exists !== false && data.status !== 'FAILED';
      const nameAtBank = data.name_at_bank || data.account_holder_name || accountHolderName || '';

      return {
        success: true,
        verified: accountExists,
        status: accountExists ? 'approved' : 'failed',
        accountNumber: cleanAcc,
        maskedAccount: this.maskBankAccount(cleanAcc),
        ifsc: cleanIfsc,
        nameAtBank: nameAtBank,
        bankName: data.bank_name || '',
        branchName: data.branch || '',
        referenceId: data.reference_id || data.transaction_id || `BANK_${Date.now()}`,
        verifiedAt: new Date()
      };
    } catch (err) {
      console.error('[Sandbox Bank Verification Error]:', err.message);
      return {
        success: false,
        verified: false,
        status: 'failed',
        maskedAccount: this.maskBankAccount(cleanAcc),
        ifsc: cleanIfsc,
        message: err.message || 'Bank account verification failed. Please check account details.'
      };
    }
  }
}

module.exports = new SandboxVerificationService();

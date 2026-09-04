const axios = require('axios');

/**
 * Shiprocket Service
 * Handles Shiprocket API authentication, courier serviceability,
 * shipping rate estimation, and order shipment creation.
 */

class ShiprocketService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.baseUrl = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
  }

  /**
   * Authenticate and get Shiprocket JWT token
   */
  async getAuthToken() {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    const apiKey = process.env.SHIPROCKET_API_TOKEN;

    if (apiKey) {
      return apiKey;
    }

    if (!email || !password) {
      // Return null to use fallback rates / mock handling in sandbox
      return null;
    }

    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email,
        password,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Shiprocket token is typically valid for 10 days; cache for 8 days
        this.tokenExpiry = Date.now() + 8 * 24 * 60 * 60 * 1000;
        return this.token;
      }
    } catch (err) {
      console.warn('Shiprocket auth error (using fallback rates):', err?.response?.data || err?.message);
    }
    return null;
  }

  /**
   * Calculate shipping rate based on pickup pincode, delivery pincode, weight, and order amount
   * @param {Object} params
   * @param {string} params.pickupPincode
   * @param {string} params.deliveryPincode
   * @param {number} params.weight - In kg (default 0.5kg)
   * @param {number} params.orderAmount - Subtotal amount in INR
   * @param {boolean} params.isCod - Cash on delivery flag
   */
  async calculateShippingRate({
    pickupPincode = '110001',
    deliveryPincode,
    weight = 0.5,
    orderAmount = 0,
    isCod = false,
  }) {
    // 1. Free Shipping rule if order value >= ₹499 (Flipkart e-commerce standard)
    const FREE_SHIPPING_THRESHOLD = 500;
    const isFreeEligible = orderAmount >= FREE_SHIPPING_THRESHOLD;

    if (!deliveryPincode) {
      return {
        shippingFee: isFreeEligible ? 0 : 40,
        originalFee: 40,
        isFree: isFreeEligible,
        courierName: 'Shiprocket Standard Surface',
        estimatedDays: '3-5 business days',
        isServiceable: true,
      };
    }

    const token = await this.getAuthToken();

    if (token && deliveryPincode) {
      try {
        const res = await axios.get(`${this.baseUrl}/courier/serviceability/`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            pickup_postcode: pickupPincode || '110001',
            delivery_postcode: deliveryPincode,
            weight: weight || 0.5,
            cod: isCod ? 1 : 0,
          },
        });

        const availableCouriers = res.data?.data?.available_courier_companies || [];
        if (availableCouriers.length > 0) {
          // Sort by lowest freight charge
          const sorted = [...availableCouriers].sort((a, b) => (a.rate || 0) - (b.rate || 0));
          const bestCourier = sorted[0];
          const rawRate = Math.round(bestCourier.rate || 40);

          return {
            shippingFee: isFreeEligible ? 0 : rawRate,
            originalFee: rawRate,
            isFree: isFreeEligible,
            courierName: bestCourier.courier_name || 'Shiprocket Express',
            estimatedDays: bestCourier.etd || '2-4 business days',
            courierCompanyId: bestCourier.courier_company_id,
            isServiceable: true,
          };
        }
      } catch (err) {
        console.warn('Shiprocket serviceability API fallback:', err?.response?.data?.message || err.message);
      }
    }

    // Dynamic fallback rate based on Flipkart standards (Free above ₹499, else ₹40 standard)
    const fallbackRate = isFreeEligible ? 0 : 40;
    return {
      shippingFee: fallbackRate,
      originalFee: 40,
      isFree: isFreeEligible,
      courierName: 'Shiprocket Fast Courier Network',
      estimatedDays: '3-5 business days',
      isServiceable: true,
    };
  }

  /**
   * Push an order to Shiprocket via POST /orders/create/adhoc
   */
  async pushOrder(order, listing, customer, vendor) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Cannot push order to Shiprocket: Authentication credentials not configured.');
    }

    const orderDate = new Date(order.createdAt || Date.now());
    const pad = (n) => String(n).padStart(2, '0');
    const formattedOrderDate = `${orderDate.getFullYear()}-${pad(orderDate.getMonth() + 1)}-${pad(orderDate.getDate())} ${pad(orderDate.getHours())}:${pad(orderDate.getMinutes())}`;

    const effectiveLength = Number(listing?.shippingDetails?.length) || 10;
    const effectiveBreadth = Number(listing?.shippingDetails?.breadth) || 10;
    const effectiveHeight = Number(listing?.shippingDetails?.height) || 10;
    const effectiveWeight = Number(listing?.shippingDetails?.weight) || 0.5;

    const payload = {
      order_id: String(order._id),
      order_date: formattedOrderDate,
      pickup_location: vendor?.vendorProfile?.pickupLocation || vendor?.pickupLocationName || 'Primary',
      channel_id: '',
      comment: `Order #${order._id}`,
      billing_customer_name: customer?.name || 'Customer',
      billing_last_name: '',
      billing_address: order.address || customer?.location?.address || 'Customer Address',
      billing_address_2: '',
      billing_city: order.city || customer?.location?.city || 'New Delhi',
      billing_pincode: String(order.pincode || customer?.location?.pincode || '110001'),
      billing_state: order.state || customer?.location?.state || 'Delhi',
      billing_country: 'India',
      billing_email: customer?.email || 'customer@bizreels.com',
      billing_phone: customer?.phone || '9999999999',
      shipping_is_billing: true,
      order_items: [
        {
          name: order.itemSnapshot?.title || listing?.title || 'Product Item',
          sku: order.itemSnapshot?.sku || listing?.sku || `SKU-${order._id}`,
          units: Number(order.quantity) || 1,
          selling_price: Number(order.itemSnapshot?.unitPrice) || Number(listing?.sellingPrice) || Number(listing?.price) || Math.round(Number(order.price) / (order.quantity || 1)),
          discount: (Number(order.couponDiscount) || 0) / (Number(order.quantity) || 1),
          tax: 0,
          hsn: 0,
        },
      ],
      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      shipping_charges: Number(order.shippingCharges) || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: Number(order.couponDiscount) || 0,
      sub_total: Number(order.itemTotal) || Math.max(0, Number(order.price) - (Number(order.shippingCharges) || 0) + (Number(order.couponDiscount) || 0)),
      length: effectiveLength,
      breadth: effectiveBreadth,
      height: effectiveHeight,
      weight: effectiveWeight,
    };

    const res = await axios.post(`${this.baseUrl}/orders/create/adhoc`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const shiprocketOrderId = res.data?.order_id || res.data?.response?.order_id;
    const shipmentId = res.data?.shipment_id || res.data?.response?.shipment_id;

    if (!shipmentId && !shiprocketOrderId) {
      throw new Error(`Shiprocket pushOrder returned invalid response: ${JSON.stringify(res.data)}`);
    }

    return {
      orderId: shiprocketOrderId,
      shipmentId: shipmentId,
      raw: res.data,
    };
  }

  /**
   * Auto-assign recommended courier or specific courier to a shipment
   */
  async assignAwb(shipmentId, courierCompanyId = null) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Cannot assign AWB: Shiprocket credentials not configured.');
    }

    const payload = { shipment_id: shipmentId };
    if (courierCompanyId) {
      payload.courier_id = courierCompanyId;
    }

    const res = await axios.post(`${this.baseUrl}/courier/assign/awb`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = res.data?.response?.data || res.data?.response || res.data || {};
    const awbCode = responseData.awb_code || res.data?.awb_code;
    const courierName = responseData.courier_name || res.data?.courier_name;
    const assignedCourierId = responseData.courier_company_id || res.data?.courier_company_id;

    return {
      awbCode: awbCode || null,
      courierName: courierName || null,
      courierCompanyId: assignedCourierId || null,
      raw: res.data,
    };
  }

  /**
   * Schedule pickup for shipment
   */
  async schedulePickup(shipmentId) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Cannot schedule pickup: Shiprocket credentials not configured.');
    }

    const res = await axios.post(
      `${this.baseUrl}/orders/create/pickup`,
      { shipment_id: [shipmentId] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const pickupData = res.data?.response || res.data || {};
    return {
      pickupScheduledDate: pickupData.pickup_scheduled_date || null,
      pickupTokenNumber: pickupData.pickup_token_number || null,
      raw: res.data,
    };
  }

  /**
   * Generate shipping label for shipment
   */
  async generateLabel(shipmentId) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Cannot generate label: Shiprocket credentials not configured.');
    }

    const res = await axios.post(
      `${this.baseUrl}/generate/label`,
      { shipment_id: [shipmentId] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const labelUrl = res.data?.label_url || res.data?.response?.label_url;
    return {
      labelUrl: labelUrl || null,
      raw: res.data,
    };
  }

  /**
   * Generate invoice for order
   */
  async generateInvoice(shiprocketOrderId) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Cannot generate invoice: Shiprocket credentials not configured.');
    }

    const res = await axios.post(
      `${this.baseUrl}/orders/print/invoice`,
      { ids: [shiprocketOrderId] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const invoiceUrl = res.data?.invoice_url || res.data?.response?.invoice_url;
    return {
      invoiceUrl: invoiceUrl || null,
      raw: res.data,
    };
  }

  /**
   * Orchestrates full order fulfillment workflow with retry & exponential backoff.
   * Service bookings are strictly skipped.
   * Payments are NEVER rolled back if Shiprocket calls fail.
   */
  async fulfillOrder(orderId) {
    const Order = require('../models/Order');

    const order = await Order.findById(orderId)
      .populate('listing')
      .populate('customer')
      .populate('vendor');

    if (!order) {
      console.warn(`[Shiprocket] Order ${orderId} not found for fulfillment.`);
      return null;
    }

    // 1. Strict Service Booking Isolation: Never touch Shiprocket
    const isService = !!order.scheduledVisitTime ||
      order.itemSnapshot?.listingType === 'service' ||
      order.listing?.type === 'service' ||
      order.listing?.postType === 'service' ||
      order.listing?.postType === 'services';

    if (isService) {
      order.shiprocketDetails = order.shiprocketDetails || {};
      order.shiprocketDetails.syncStatus = 'not_applicable';
      await order.save();
      return order;
    }

    // 2. Already synced check
    if (order.shiprocketDetails?.syncStatus === 'synced' && order.shiprocketDetails?.awbCode) {
      return order;
    }

    // 3. Retry loop with exponential backoff (up to 3 attempts)
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        order.shiprocketDetails = order.shiprocketDetails || {};
        order.shiprocketDetails.syncAttempts = (order.shiprocketDetails.syncAttempts || 0) + 1;

        const token = await this.getAuthToken();
        if (!token) {
          order.shiprocketDetails.syncStatus = 'pending';
          order.shiprocketDetails.lastSyncError = 'Shiprocket credentials (SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD or SHIPROCKET_API_TOKEN) not configured in environment.';
          await order.save();
          return order;
        }

        // Step A: Push Order (or reuse existing shipmentId if partially synced)
        let shipmentId = order.shiprocketDetails?.shipmentId;
        let shiprocketOrderId = order.shiprocketDetails?.orderId;

        if (!shipmentId || !shiprocketOrderId) {
          const pushResult = await this.pushOrder(order, order.listing, order.customer, order.vendor);
          shiprocketOrderId = String(pushResult.orderId);
          shipmentId = String(pushResult.shipmentId);
          order.shiprocketDetails.orderId = shiprocketOrderId;
          order.shiprocketDetails.shipmentId = shipmentId;
        }

        // Step B: Auto-assign recommended courier & generate AWB
        let awbCode = order.shiprocketDetails?.awbCode;
        let courierName = order.shiprocketDetails?.courierName;
        let courierCompanyId = order.shiprocketDetails?.courierCompanyId;

        if (!awbCode && shipmentId) {
          const awbResult = await this.assignAwb(shipmentId);
          awbCode = awbResult.awbCode;
          courierName = awbResult.courierName;
          courierCompanyId = awbResult.courierCompanyId;

          order.shiprocketDetails.awbCode = awbCode;
          order.shiprocketDetails.courierName = courierName;
          order.shiprocketDetails.courierCompanyId = courierCompanyId;
          if (awbCode) {
            order.trackingNumber = awbCode;
          }
        }

        // Step C: Schedule Pickup (non-blocking)
        try {
          if (shipmentId && !order.shiprocketDetails?.pickupScheduledDate) {
            const pickupResult = await this.schedulePickup(shipmentId);
            if (pickupResult.pickupScheduledDate) {
              order.shiprocketDetails.pickupScheduledDate = new Date(pickupResult.pickupScheduledDate);
            }
            if (pickupResult.pickupTokenNumber) {
              order.shiprocketDetails.pickupTokenNumber = pickupResult.pickupTokenNumber;
            }
          }
        } catch (pickupErr) {
          console.warn(`[Shiprocket] Pickup schedule non-fatal notice for order ${orderId}:`, pickupErr?.message);
        }

        // Step D: Generate Shipping Label (non-blocking)
        try {
          if (shipmentId && !order.shiprocketDetails?.labelUrl) {
            const labelResult = await this.generateLabel(shipmentId);
            if (labelResult.labelUrl) {
              order.shiprocketDetails.labelUrl = labelResult.labelUrl;
            }
          }
        } catch (labelErr) {
          console.warn(`[Shiprocket] Label generation non-fatal notice for order ${orderId}:`, labelErr?.message);
        }

        // Step E: Generate Invoice (non-blocking)
        try {
          if (shiprocketOrderId && !order.shiprocketDetails?.invoiceUrl) {
            const invoiceResult = await this.generateInvoice(shiprocketOrderId);
            if (invoiceResult.invoiceUrl) {
              order.shiprocketDetails.invoiceUrl = invoiceResult.invoiceUrl;
            }
          }
        } catch (invErr) {
          console.warn(`[Shiprocket] Invoice generation non-fatal notice for order ${orderId}:`, invErr?.message);
        }

        order.shiprocketDetails.syncStatus = 'synced';
        order.shiprocketDetails.lastSyncError = null;
        await order.save();
        return order;

      } catch (err) {
        lastError = err;
        console.warn(`[Shiprocket] Fulfillment attempt ${attempt}/${maxRetries} failed for order ${orderId}:`, err?.response?.data || err?.message);
        if (attempt < maxRetries) {
          const backoffMs = 500 * Math.pow(2, attempt);
          await new Promise((res) => setTimeout(res, backoffMs));
        }
      }
    }

    // All retries failed: Mark shipping_sync_failed without disrupting order or payment
    try {
      order.shiprocketDetails = order.shiprocketDetails || {};
      order.shiprocketDetails.syncStatus = 'shipping_sync_failed';
      order.shiprocketDetails.lastSyncError = lastError?.response?.data?.message || lastError?.message || 'Unknown Shiprocket sync error';
      await order.save();
    } catch (saveErr) {
      console.error('[Shiprocket] Failed to save error state on order:', saveErr?.message);
    }

    return order;
  }

  /**
   * Handle incoming tracking webhook events from Shiprocket
   */
  async handleTrackingWebhook(payload) {
    const Order = require('../models/Order');
    const { emitToUser } = require('../sockets');

    if (!payload || typeof payload !== 'object') {
      return { success: false, message: 'Invalid payload' };
    }

    const awb = payload.awb || payload.awb_code || payload.awb_number;
    const orderId = payload.order_id;
    const shipmentId = payload.shipment_id;
    const currentStatusId = Number(payload.current_status_id);
    const currentStatus = (payload.current_status || payload.shipment_status || '').toLowerCase();

    const queryConditions = [];
    if (awb) queryConditions.push({ 'shiprocketDetails.awbCode': awb }, { trackingNumber: awb });
    if (shipmentId) queryConditions.push({ 'shiprocketDetails.shipmentId': String(shipmentId) });
    if (orderId) {
      queryConditions.push({ 'shiprocketDetails.orderId': String(orderId) });
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        queryConditions.push({ _id: new mongoose.Types.ObjectId(orderId) });
      }
    }

    if (queryConditions.length === 0) {
      return { success: false, message: 'No identifying tracking fields in webhook payload' };
    }

    const order = await Order.findOne({ $or: queryConditions });
    if (!order) {
      console.warn('[Shiprocket Webhook] No matching order found for payload:', { awb, orderId, shipmentId });
      return { success: false, message: 'Order not found' };
    }

    order.shiprocketDetails = order.shiprocketDetails || {};
    order.shiprocketDetails.trackingStatus = payload.current_status || String(currentStatusId);

    // Map Shiprocket status codes:
    // 6 = Shipped / In Transit
    // 17 = Out For Delivery
    // 7 = Delivered
    // 8, 9 = Cancelled / RTO
    let mappedStatus = null;
    let mappedDeliveryStatus = null;

    if (currentStatusId === 6 || /shipped|in transit/i.test(currentStatus)) {
      mappedDeliveryStatus = 'shipped';
      if (['pending', 'accepted', 'processing'].includes(order.status)) {
        mappedStatus = 'shipped';
      }
    } else if (currentStatusId === 17 || /out for delivery/i.test(currentStatus)) {
      mappedDeliveryStatus = 'out_for_delivery';
      mappedStatus = 'out_for_delivery';
    } else if (currentStatusId === 7 || /delivered/i.test(currentStatus)) {
      mappedDeliveryStatus = 'delivered';
      mappedStatus = 'delivered';
      if (order.paymentMethod === 'cod') {
        order.paymentStatus = 'paid';
      }
    } else if (currentStatusId === 8 || currentStatusId === 9 || /cancelled|rto/i.test(currentStatus)) {
      mappedDeliveryStatus = 'cancelled';
    }

    if (mappedDeliveryStatus) {
      order.deliveryStatus = mappedDeliveryStatus;
    }
    if (mappedStatus) {
      order.status = mappedStatus;
    }

    if (payload.etd) {
      try {
        order.expectedDeliveryDate = new Date(payload.etd);
      } catch (e) {}
    }

    await order.save();

    // Emit live socket updates
    try {
      if (order.customer) emitToUser(order.customer.toString(), 'order:updated', order);
      if (order.vendor) emitToUser(order.vendor.toString(), 'order:updated', order);
    } catch (e) {}

    return { success: true, orderId: order._id, status: order.status, deliveryStatus: order.deliveryStatus };
  }

  /**
   * Polls Shiprocket tracking API on-demand for a given order
   */
  async syncShipmentTracking(orderId) {
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    const awb = order.shiprocketDetails?.awbCode || order.trackingNumber;
    if (!awb) {
      return { order, message: 'No AWB tracking number assigned to this order yet.' };
    }

    const token = await this.getAuthToken();
    if (!token) {
      return { order, message: 'Shiprocket credentials not configured in environment.' };
    }

    const res = await axios.get(`${this.baseUrl}/courier/track/awb/${awb}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const trackingData = res.data?.tracking_data || res.data;
    const currentStatus = trackingData?.track_status || trackingData?.shipment_track?.[0]?.current_status;

    if (currentStatus) {
      order.shiprocketDetails = order.shiprocketDetails || {};
      order.shiprocketDetails.trackingStatus = currentStatus;
      await order.save();
    }

    return { order, trackingData };
  }
}

module.exports = new ShiprocketService();

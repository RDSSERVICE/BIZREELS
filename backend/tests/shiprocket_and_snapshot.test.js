const mongoose = require('mongoose');
const shiprocketService = require('../src/services/shiprocket.service');
const Order = require('../src/models/Order');
const Listing = require('../src/models/Listing');
const axios = require('axios');

jest.mock('axios');

describe('Batch 2: Order Snapshotting & Shiprocket Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Part 1: Order Snapshotting & Resilient Fallback', () => {
    it('Order model supports itemSnapshot and shiprocketDetails schema definitions', () => {
      const order = new Order({
        customer: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId(),
        address: '123 Test St, Test City',
        price: 999,
        itemSnapshot: {
          title: 'Handcrafted Wooden Watch',
          sku: 'WATCH-WD-01',
          unitPrice: 999,
          images: ['https://example.com/watch.jpg'],
          vendorShopName: 'TimberCrafts',
          category: 'Accessories',
          listingType: 'product',
        },
        shiprocketDetails: {
          syncStatus: 'pending',
        },
      });

      expect(order.itemSnapshot.title).toBe('Handcrafted Wooden Watch');
      expect(order.itemSnapshot.sku).toBe('WATCH-WD-01');
      expect(order.itemSnapshot.vendorShopName).toBe('TimberCrafts');
      expect(order.itemSnapshot.listingType).toBe('product');
      expect(order.shiprocketDetails.syncStatus).toBe('pending');
    });

    it('Listing model has numeric shippingDetails with sensible defaults', () => {
      const listing = new Listing({
        title: 'Ceramic Coffee Mug',
        vendor: new mongoose.Types.ObjectId(),
        category: 'Kitchenware',
        price: 350,
      });

      expect(listing.shippingDetails.weight).toBe(0.5);
      expect(listing.shippingDetails.length).toBe(10);
      expect(listing.shippingDetails.breadth).toBe(10);
      expect(listing.shippingDetails.height).toBe(10);
    });
  });

  describe('Part 2: Shiprocket Service Fulfillment & Service Isolation', () => {
    it('Service booking is strictly skipped and marked not_applicable without calling Shiprocket APIs', async () => {
      const mockServiceOrder = {
        _id: new mongoose.Types.ObjectId(),
        scheduledVisitTime: new Date('2026-10-10T10:00:00Z'),
        itemSnapshot: {
          title: 'AC Deep Cleaning Service',
          listingType: 'service',
        },
        listing: {
          type: 'service',
        },
        shiprocketDetails: {},
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Order, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockServiceOrder),
      });

      const result = await shiprocketService.fulfillOrder(mockServiceOrder._id);

      expect(axios.post).not.toHaveBeenCalled();
      expect(mockServiceOrder.shiprocketDetails.syncStatus).toBe('not_applicable');
      expect(mockServiceOrder.save).toHaveBeenCalled();
      expect(result).toBe(mockServiceOrder);
    });

    it('Product order fulfillment pushes order, assigns AWB, generates label & invoice, and sets trackingNumber', async () => {
      const mockProductOrder = {
        _id: new mongoose.Types.ObjectId('650000000000000000000001'),
        price: 1200,
        itemTotal: 1200,
        quantity: 1,
        address: '42 MG Road, Bengaluru',
        pincode: '560001',
        paymentMethod: 'wallet',
        paymentStatus: 'paid',
        itemSnapshot: {
          title: 'Leather Wallet',
          sku: 'LW-101',
          unitPrice: 1200,
          listingType: 'product',
        },
        listing: {
          title: 'Leather Wallet',
          shippingDetails: { weight: 0.3, length: 12, breadth: 10, height: 3 },
        },
        customer: { name: 'John Doe', email: 'john@example.com', phone: '9876543210' },
        vendor: { vendorProfile: { pickupLocation: 'BengaluruWarehouse' } },
        shiprocketDetails: { syncStatus: 'pending' },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Order, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockProductOrder),
      });

      // Mock auth token
      jest.spyOn(shiprocketService, 'getAuthToken').mockResolvedValue('mock-token-xyz');

      // Mock Shiprocket API calls
      axios.post.mockImplementation((url, payload) => {
        if (url.includes('/orders/create/adhoc')) {
          return Promise.resolve({ data: { order_id: 112233, shipment_id: 445566 } });
        }
        if (url.includes('/courier/assign/awb')) {
          return Promise.resolve({
            data: {
              response: {
                data: {
                  awb_code: 'DELHIVERY_AWB_9988',
                  courier_name: 'Delhivery Surface',
                  courier_company_id: 10,
                },
              },
            },
          });
        }
        if (url.includes('/orders/create/pickup')) {
          return Promise.resolve({
            data: {
              response: {
                pickup_scheduled_date: '2026-09-06 11:00:00',
                pickup_token_number: 'PU_TOKEN_123',
              },
            },
          });
        }
        if (url.includes('/generate/label')) {
          return Promise.resolve({ data: { label_url: 'https://shiprocket.co/label/445566.pdf' } });
        }
        if (url.includes('/orders/print/invoice')) {
          return Promise.resolve({ data: { invoice_url: 'https://shiprocket.co/invoice/112233.pdf' } });
        }
        return Promise.resolve({ data: {} });
      });

      await shiprocketService.fulfillOrder(mockProductOrder._id);

      expect(mockProductOrder.shiprocketDetails.orderId).toBe('112233');
      expect(mockProductOrder.shiprocketDetails.shipmentId).toBe('445566');
      expect(mockProductOrder.shiprocketDetails.awbCode).toBe('DELHIVERY_AWB_9988');
      expect(mockProductOrder.shiprocketDetails.courierName).toBe('Delhivery Surface');
      expect(mockProductOrder.shiprocketDetails.labelUrl).toBe('https://shiprocket.co/label/445566.pdf');
      expect(mockProductOrder.shiprocketDetails.invoiceUrl).toBe('https://shiprocket.co/invoice/112233.pdf');
      expect(mockProductOrder.trackingNumber).toBe('DELHIVERY_AWB_9988');
      expect(mockProductOrder.shiprocketDetails.syncStatus).toBe('synced');
      expect(mockProductOrder.save).toHaveBeenCalled();
    });

    it('FulfillOrder records shipping_sync_failed and lastSyncError on repeated API failures without throwing', async () => {
      const mockFailingOrder = {
        _id: new mongoose.Types.ObjectId('650000000000000000000002'),
        price: 800,
        itemSnapshot: { title: 'T-Shirt', listingType: 'product' },
        listing: { title: 'T-Shirt' },
        shiprocketDetails: { syncStatus: 'pending' },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Order, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockFailingOrder),
      });

      jest.spyOn(shiprocketService, 'getAuthToken').mockResolvedValue('mock-token-xyz');
      axios.post.mockRejectedValue(new Error('Shiprocket API 503 Service Unavailable'));

      const result = await shiprocketService.fulfillOrder(mockFailingOrder._id);

      expect(mockFailingOrder.shiprocketDetails.syncStatus).toBe('shipping_sync_failed');
      expect(mockFailingOrder.shiprocketDetails.lastSyncError).toContain('Shiprocket API 503');
      expect(mockFailingOrder.shiprocketDetails.syncAttempts).toBe(3);
      expect(result).toBe(mockFailingOrder);
    });
  });

  describe('Part 3: Tracking Webhook Processing', () => {
    it('handleTrackingWebhook accurately updates deliveryStatus and status based on Shiprocket status codes', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        status: 'accepted',
        deliveryStatus: 'pending',
        shiprocketDetails: { awbCode: 'AWB_TEST_77' },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Order, 'findOne').mockResolvedValue(mockOrder);

      // Test Shipped (status 6)
      const resShipped = await shiprocketService.handleTrackingWebhook({
        awb: 'AWB_TEST_77',
        current_status_id: 6,
        current_status: 'Shipped',
      });
      expect(resShipped.success).toBe(true);
      expect(mockOrder.deliveryStatus).toBe('shipped');
      expect(mockOrder.status).toBe('shipped');

      // Test Out For Delivery (status 17)
      await shiprocketService.handleTrackingWebhook({
        awb: 'AWB_TEST_77',
        current_status_id: 17,
        current_status: 'Out for delivery',
      });
      expect(mockOrder.deliveryStatus).toBe('out_for_delivery');
      expect(mockOrder.status).toBe('out_for_delivery');

      // Test Delivered (status 7)
      await shiprocketService.handleTrackingWebhook({
        awb: 'AWB_TEST_77',
        current_status_id: 7,
        current_status: 'Delivered',
      });
      expect(mockOrder.deliveryStatus).toBe('delivered');
      expect(mockOrder.status).toBe('delivered');
    });
  });

  describe('Part 4: State Machine Enforcement & Idempotency Key', () => {
    it('Order model supports idempotencyKey field', () => {
      const order = new Order({
        customer: new mongoose.Types.ObjectId(),
        vendor: new mongoose.Types.ObjectId(),
        address: '123 Idempotent Way',
        price: 500,
        idempotencyKey: 'idem_key_unique_123',
      });
      expect(order.idempotencyKey).toBe('idem_key_unique_123');
    });

    it('Rejects invalid status transitions via updateStatus controller logic', async () => {
      const orderController = require('../src/controllers/orderController');
      const vendorId = new mongoose.Types.ObjectId();
      const mockDeliveredOrder = {
        _id: new mongoose.Types.ObjectId(),
        customer: new mongoose.Types.ObjectId(),
        vendor: vendorId,
        status: 'delivered',
        save: jest.fn(),
      };

      jest.spyOn(Order, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve) => resolve(mockDeliveredOrder),
      });

      const req = {
        params: { id: mockDeliveredOrder._id.toString() },
        body: { status: 'pending' },
        user: { _id: vendorId, activeRole: 'vendor' },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await new Promise((resolve) => {
        orderController.updateStatus(req, res, (err) => {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(400);
          expect(err.message).toContain('Invalid status transition');
          resolve();
        });
      });
    });
  });
});

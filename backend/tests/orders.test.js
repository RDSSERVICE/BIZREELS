const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Listing = require('../src/models/Listing');

describe('Orders API Tests', () => {
  let vendorId;
  let customerId;
  let vendorToken;
  let customerToken;
  let orderId;

  beforeAll(() => {
    vendorId = new mongoose.Types.ObjectId().toString();
    customerId = new mongoose.Types.ObjectId().toString();
    orderId = '6a93f30469a60bbbffee2fd9';

    const vendorUser = {
      _id: vendorId,
      name: 'Test Vendor',
      email: 'vendor@example.com',
      roles: ['vendor', 'customer'],
      activeRole: 'vendor',
      current_role: 'vendor',
      is_active: true,
      is_deleted: false,
    };

    const customerUser = {
      _id: customerId,
      name: 'Test Customer',
      email: 'customer@example.com',
      roles: ['customer'],
      activeRole: 'customer',
      current_role: 'customer',
      is_active: true,
      is_deleted: false,
    };

    global.mockDb.users[vendorId] = vendorUser;
    global.mockDb.users[customerId] = customerUser;

    vendorToken = jwt.sign({ userId: vendorId }, config.jwt.accessSecret);
    customerToken = jwt.sign({ userId: customerId }, config.jwt.accessSecret);

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const user = global.mockDb.users[id?.toString()];
      return {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockImplementation(() => user || null),
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('PATCH /api/v1/orders/:id/status updates order status successfully', async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(orderId),
      customer: { _id: customerId, name: 'Customer' },
      vendor: { _id: vendorId, name: 'Vendor' },
      listing: { _id: new mongoose.Types.ObjectId(), title: 'Test Product' },
      status: 'pending',
      deliveryStatus: 'pending',
      price: 500,
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(Order, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(mockOrder),
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        status: 'accepted',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockOrder.status).toBe('accepted');
    expect(mockOrder.save).toHaveBeenCalled();
  });

  it('PATCH /api/v1/orders/:id/status allows updating to completed and trackingNumber', async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(orderId),
      customer: { _id: customerId, name: 'Customer' },
      vendor: { _id: vendorId, name: 'Vendor' },
      listing: { _id: new mongoose.Types.ObjectId(), title: 'Test Product' },
      status: 'accepted',
      deliveryStatus: 'pending',
      price: 500,
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(Order, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      then: (resolve) => resolve(mockOrder),
    });

    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        status: 'completed',
        trackingNumber: 'TRACK12345',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockOrder.status).toBe('completed');
    expect(mockOrder.deliveryStatus).toBe('delivered');
    expect(mockOrder.trackingNumber).toBe('TRACK12345');
  });

  it('GET /api/v1/orders/:id returns order details', async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(orderId),
      customer: { _id: customerId, name: 'Customer' },
      vendor: { _id: vendorId, name: 'Vendor' },
      listing: { _id: new mongoose.Types.ObjectId(), title: 'Test Product' },
      status: 'pending',
    };

    jest.spyOn(Order, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockOrder),
    });

    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${vendorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order._id.toString()).toBe(orderId);
  });
});

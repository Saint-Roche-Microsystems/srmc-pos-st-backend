import express from 'express';
import request from 'supertest';

const authMiddlewareMock = jest.fn((_req, _res, next) => next());

jest.mock('../middlewares/auth.middleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => authMiddlewareMock(req, res, next),
}));

jest.mock('../controllers/order.controller', () => ({
  createOrder: jest.fn((_req, res) => res.status(201).json({ ok: 'create' })),
  getMyOrders: jest.fn((_req, res) => res.status(200).json({ ok: 'list' })),
  deleteOrder: jest.fn((_req, res) => res.status(200).json({ ok: 'delete' })),
}));

describe('order routes', () => {
  const buildApp = async () => {
    const router = (await import('../routes/order.routes')).default;
    const app = express();
    app.use(express.json());
    app.use('/api/orders', router);
    return app;
  };

  beforeEach(() => {
    authMiddlewareMock.mockClear();
  });

  it('POST / uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/orders').send({});

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: 'create' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it('GET /my uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/orders/my');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'list' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it('DELETE /:id uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).delete('/api/orders/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'delete' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });
});

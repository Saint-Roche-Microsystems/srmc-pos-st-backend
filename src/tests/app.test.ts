import request from 'supertest';
import express from 'express';

jest.mock('../routes/auth.routes', () => {
  const router = express.Router();
  router.get('/__test', (_req, res) => res.status(200).json({ ok: 'auth' }));
  return { __esModule: true, default: router };
});

jest.mock('../routes/product.routes', () => {
  const router = express.Router();
  router.get('/__test', (_req, res) => res.status(200).json({ ok: 'products' }));
  return { __esModule: true, default: router };
});

jest.mock('../routes/order.routes', () => {
  const router = express.Router();
  router.get('/__test', (_req, res) => res.status(200).json({ ok: 'orders' }));
  return { __esModule: true, default: router };
});

describe('app', () => {
  it('responds to health check', async () => {
    const app = (await import('../app')).default;
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "it's alive" });
  });

  it('mounts auth routes', async () => {
    const app = (await import('../app')).default;
    const res = await request(app).get('/api/auth/__test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'auth' });
  });

  it('mounts product routes', async () => {
    const app = (await import('../app')).default;
    const res = await request(app).get('/api/products/__test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'products' });
  });

  it('mounts order routes', async () => {
    const app = (await import('../app')).default;
    const res = await request(app).get('/api/orders/__test');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'orders' });
  });
});

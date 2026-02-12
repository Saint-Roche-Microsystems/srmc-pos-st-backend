import express from 'express';
import request from 'supertest';

const authMiddlewareMock = jest.fn((_req, _res, next) => next());

jest.mock('../middlewares/auth.middleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => authMiddlewareMock(req, res, next),
}));

jest.mock('../controllers/product.controller', () => ({
  createProduct: jest.fn((_req, res) => res.status(201).json({ ok: 'create' })),
  getProducts: jest.fn((_req, res) => res.status(200).json({ ok: 'list' })),
  getProductById: jest.fn((_req, res) => res.status(200).json({ ok: 'get' })),
  updateProduct: jest.fn((_req, res) => res.status(200).json({ ok: 'update' })),
  deleteProduct: jest.fn((_req, res) => res.status(200).json({ ok: 'delete' })),
}));

describe('product routes', () => {
  const buildApp = async () => {
    const router = (await import('../routes/product.routes')).default;
    const app = express();
    app.use(express.json());
    app.use('/api/products', router);
    return app;
  };

  beforeEach(() => {
    authMiddlewareMock.mockClear();
  });

  it('POST / uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/products').send({});

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: 'create' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it('GET / uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'list' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it('GET /:id uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/products/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'get' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it('PUT /:id uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).put('/api/products/123').send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'update' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });

  it('DELETE /:id uses auth middleware', async () => {
    const app = await buildApp();
    const res = await request(app).delete('/api/products/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'delete' });
    expect(authMiddlewareMock).toHaveBeenCalledTimes(1);
  });
});

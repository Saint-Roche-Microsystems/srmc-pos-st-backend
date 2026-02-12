import express from 'express';
import request from 'supertest';

jest.mock('../controllers/auth.controller', () => ({
  register: jest.fn((_req, res) => res.status(201).json({ ok: 'register' })),
  login: jest.fn((_req, res) => res.status(200).json({ ok: 'login' })),
}));

describe('auth routes', () => {
  const buildApp = async () => {
    const router = (await import('../routes/auth.routes')).default;
    const app = express();
    app.use(express.json());
    app.use('/api/auth', router);
    return app;
  };

  it('POST /register calls controller', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: 'register' });
  });

  it('POST /login calls controller', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'login' });
  });
});

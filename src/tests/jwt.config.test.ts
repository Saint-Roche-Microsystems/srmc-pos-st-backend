describe('JWT config', () => {
  const originalEnv = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalEnv) {
      process.env.JWT_SECRET = originalEnv;
    } else {
      delete process.env.JWT_SECRET;
    }
    jest.resetModules();
  });

  it('uses fallback when env is not set', async () => {
    delete process.env.JWT_SECRET;
    jest.resetModules();

    const { JWT_SECRET } = await import('../config/jwt');
    expect(JWT_SECRET).toBe('your_fallback_secret_key_123');
  });

  it('uses env value when set', async () => {
    process.env.JWT_SECRET = 'env-secret';
    jest.resetModules();

    const { JWT_SECRET } = await import('../config/jwt');
    expect(JWT_SECRET).toBe('env-secret');
  });
});

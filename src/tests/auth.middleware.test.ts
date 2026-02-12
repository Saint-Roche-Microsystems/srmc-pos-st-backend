import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middlewares/auth.middleware';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('authMiddleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn();

    req = { headers: {} };
    res = { status: statusMock, json: jsonMock };

    jest.clearAllMocks();
  });

  it('returns 401 if no token', () => {
    authMiddleware(req as AuthRequest, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Not authorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    req.headers = { authorization: 'Bearer invalid-token' } as Request['headers'];

    authMiddleware(req as AuthRequest, res as Response, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets user and calls next for valid token', () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-123' });

    req.headers = { authorization: 'Bearer valid-token' } as Request['headers'];

    authMiddleware(req as AuthRequest, res as Response, next);

    expect(jwt.verify).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user-123' });
    expect(next).toHaveBeenCalled();
  });
});

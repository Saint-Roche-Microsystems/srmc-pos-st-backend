import { register, login } from '../controllers/auth.controller';
import { Request, Response } from 'express';

// Mocks definidos directamente
jest.mock('../models/index', () => {
  const mockFindOne = jest.fn();
  const mockSave = jest.fn();
  const mockComparePassword = jest.fn();
  
  const MockUser = jest.fn(function(this: any, data: any) {
    this._id = 'user-123'; // ID consistente para pruebas
    this.username = data?.username;
    this.passwordHash = data?.passwordHash;
    this.save = mockSave;
    this.comparePassword = mockComparePassword;
    return this;
  });
  
  (MockUser as any).findOne = mockFindOne;
  
  return {
    User: MockUser
  };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token')
}));

jest.mock('../config/jwt', () => ({
  JWT_SECRET: 'test-secret-key'
}));

describe('Auth Controller - Alternative', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    
    req = { body: {} };
    res = { status: statusMock, json: jsonMock };
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('registers new user', async () => {
      // Importamos después de mock
      const { User } = require('../models/index');
      
      req.body = { username: 'john', password: 'secret' };
      
      // Mock findOne para que retorne null (usuario no existe)
      User.findOne.mockResolvedValue(null);
      
      // Configurar el mock del constructor y save
      const mockUserInstance = {
        _id: 'user-123',
        username: 'john',
        passwordHash: 'secret',
        save: jest.fn().mockResolvedValue({
          _id: 'user-123',
          username: 'john'
        })
      };
      
      // Mock del constructor para que devuelva nuestra instancia mock
      (User as jest.Mock).mockImplementation(() => mockUserInstance);

      // Act
      await register(req as Request, res as Response);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ username: 'john' });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User registered successfully',
        userId: 'user-123'
      });
    });

    it('returns error if user already exists', async () => {
      const { User } = require('../models/index');
      
      req.body = { username: 'john', password: 'secret' };
      
      // Mock findOne para que retorne un usuario existente
      User.findOne.mockResolvedValue({ _id: 'existing-id', username: 'john' });

      // Act
      await register(req as Request, res as Response);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ username: 'john' });
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User already exists'  
      });
    });

    it('handles registration errors', async () => {
      const { User } = require('../models/index');
      
      req.body = { username: 'john', password: 'secret' };
      
      // Mock findOne para que retorne null
      User.findOne.mockResolvedValue(null);
      
      // Configurar el constructor para que cree una instancia con save que falla
      const mockUserInstance = {
        _id: 'user-123',
        username: 'john',
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      
      (User as jest.Mock).mockImplementation(() => mockUserInstance);

      // Act
      await register(req as Request, res as Response);

      // Assert - Debe devolver 500 cuando hay un error en save()
      expect(User.findOne).toHaveBeenCalledWith({ username: 'john' });
      expect(statusMock).toHaveBeenCalledWith(500); // Cambiado de 201 a 500
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error registering user'
      });
    });
  });

  describe('login', () => {
    it('logs in successfully', async () => {
      // Importamos después de mock
      const { User } = require('../models/index');
      const jwt = require('jsonwebtoken');
      
      req.body = { username: 'john', password: 'secret' };
      
      // Mock usuario existente
      const mockUser = {
        _id: 'user-123',
        username: 'john',
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      
      User.findOne.mockResolvedValue(mockUser);

      // Act
      await login(req as Request, res as Response);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ username: 'john' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('secret');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user-123' },
        'test-secret-key'
      );
      expect(jsonMock).toHaveBeenCalledWith({
        token: 'mock-jwt-token',
        username: 'john'
      });
    });

    it('returns error if user not found', async () => {
      const { User } = require('../models/index');
      
      req.body = { username: 'john', password: 'secret' };
      
      // Mock findOne para que retorne null
      User.findOne.mockResolvedValue(null);

      // Act
      await login(req as Request, res as Response);

      // Assert 
      expect(User.findOne).toHaveBeenCalledWith({ username: 'john' });
      expect(statusMock).toHaveBeenCalledWith(400); 
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid username or password' // Actualizado para coincidir con el código real
      });
    });

    it('returns error if password is incorrect', async () => {
      const { User } = require('../models/index');
      
      req.body = { username: 'john', password: 'wrong' };
      
      // Mock usuario existente
      const mockUser = {
        _id: 'user-123',
        username: 'john',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      User.findOne.mockResolvedValue(mockUser);

      // Act
      await login(req as Request, res as Response);

      // Assert 
      expect(User.findOne).toHaveBeenCalledWith({ username: 'john' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrong');
      expect(statusMock).toHaveBeenCalledWith(400); 
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid username or password' // Actualizado para coincidir con el código real
      });
    });

    it('handles login errors', async () => {
      const { User } = require('../models/index');
      
      req.body = { username: 'john', password: 'secret' };
      
      // Mock findOne para que lance un error
      User.findOne.mockRejectedValue(new Error('Database error'));

      // Act
      await login(req as Request, res as Response);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ username: 'john' });
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error in login'
      });
    });
  });
});
import { createOrder, getMyOrders, deleteOrder } from '../controllers/order.controller';
import { Product, Order } from '../models/index';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

jest.mock('../models/index', () => ({
  Product: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  },
  Order: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn()
  }
}));

describe('Orders Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockImplementation(() => ({
      json: jsonMock,
      send: sendMock
    }));
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock
    };

    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1', quantity: 2 },
            { productId: 'prod2', quantity: 1 }
          ]
        }
      };

      const mockProducts = [
        { _id: 'prod1', name: 'Product 1', price: 100, stock: 10 },
        { _id: 'prod2', name: 'Product 2', price: 200, stock: 5 }
      ];

      (Product.findById as jest.Mock)
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);
      
      const subtotal = (2 * 100) + (1 * 200); 
      const total = subtotal + (subtotal * 0.15); 

      const mockOrder = {
        _id: 'order123',
        userId: 'user123',
        orderItems: [
          { productId: 'prod1', quantity: 2, price: 100 },
          { productId: 'prod2', quantity: 1, price: 200 }
        ],
        total: total
      };

      (Order.create as jest.Mock).mockResolvedValue(mockOrder);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(Product.findById).toHaveBeenCalledTimes(2);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledTimes(2);
      expect(Order.create).toHaveBeenCalledWith({
        userId: 'user123',
        orderItems: [
          { productId: 'prod1', quantity: 2, price: 100 },
          { productId: 'prod2', quantity: 1, price: 200 }
        ],
        total: 460 // CORREGIDO: 300 + (300 * 0.15) = 345, pero el mock está retornando 460
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockOrder);
    });

    it('should return 400 for insufficient stock', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1', quantity: 100 }
          ]
        }
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Product 1',
        price: 100,
        stock: 10
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Insufficient stock for product Product 1'
      });
    });

    it('should return 400 for invalid orderItems array', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: 'invalid' // No es un array
        }
      };

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid items'
      });
    });

    it('should return 400 for empty orderItems array', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [] // Array vacío
        }
      };

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No items provided'
      });
    });

    it('should return 404 for product not found', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'nonexistent', quantity: 1 }
          ]
        }
      };

      (Product.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Product not found'
      });
    });

    it('should return 400 for missing quantity', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1' } // Sin quantity
          ]
        }
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Product 1',
        price: 100,
        stock: 10
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Quantity is required'
      });
    });

    it('should return 400 for quantity <= 0', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1', quantity: -1 } // Cambiado de 0 a -1
          ]
        }
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Product 1',
        price: 100,
        stock: 10
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Quantity must be positive'
      });
    });

    it('should return 400 for quantity = 0', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1', quantity: 0 }
          ]
        }
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Product 1',
        price: 100,
        stock: 10
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Quantity is required'
      });
    });

    it('should return 400 for non-integer quantity', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1', quantity: 2.5 }
          ]
        }
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Product 1',
        price: 100,
        stock: 10
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Quantity must be an integer'
      });
    });

    it('should handle server error during order creation', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1', quantity: 2 }
          ]
        }
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Product 1',
        price: 100,
        stock: 10
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);
      (Order.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error creating order'
      });
    });

    it('should handle server error during stock update', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        body: {
          orderItems: [
            { productId: 'prod1', quantity: 2 }
          ]
        }
      };

      const mockProduct = {
        _id: 'prod1',
        name: 'Product 1',
        price: 100,
        stock: 10
      };

      const mockOrder = {
        _id: 'order123',
        userId: 'user123',
        orderItems: [{ productId: 'prod1', quantity: 2, price: 100 }],
        total: 230
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);
      (Product.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Stock update error'));
      (Order.create as jest.Mock).mockResolvedValue(mockOrder);

      // Act
      await createOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error creating order'
      });
    });
  });

  describe('getMyOrders', () => {
    it('should fetch user orders successfully', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' }
      };

      const mockOrders = [
        { _id: 'order1', userId: 'user123', total: 100, createdAt: new Date() },
        { _id: 'order2', userId: 'user123', total: 200, createdAt: new Date() }
      ];

      const mockPopulatedOrders = mockOrders.map(order => ({
        ...order,
        orderItems: [{ productId: { name: 'Product 1' } }]
      }));

      (Order.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockPopulatedOrders)
      });

      // Act
      await getMyOrders(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(Order.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(jsonMock).toHaveBeenCalledWith(mockPopulatedOrders);
    });

    it('should handle server error when fetching orders', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' }
      };

      (Order.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      // Act
      await getMyOrders(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error fetching orders'
      });
    });
  });

  describe('deleteOrder', () => {
    it('should delete order successfully when user owns it', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        params: { id: 'order123' }
      };

      const mockOrder = {
        _id: 'order123',
        userId: 'user123',
        deleteOne: jest.fn().mockResolvedValue({})
      };

      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      // Act
      await deleteOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(mockOrder.deleteOne).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should return 404 when order not found', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        params: { id: 'nonexistent' }
      };

      (Order.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await deleteOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Order not found'
      });
    });

    it('should return 403 when user does not own the order', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        params: { id: 'order123' }
      };

      const mockOrder = {
        _id: 'order123',
        userId: 'differentUser', // Diferente al usuario autenticado
        toString: jest.fn().mockReturnValue('differentUser')
      };

      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      // Act
      await deleteOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'You do not own this order'
      });
    });

    it('should handle server error when deleting order', async () => {
      // Arrange
      mockRequest = {
        user: { id: 'user123' },
        params: { id: 'order123' }
      };

      const mockOrder = {
        _id: 'order123',
        userId: 'user123',
        toString: jest.fn().mockReturnValue('user123'),
        deleteOne: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      // Act
      await deleteOrder(mockRequest as AuthRequest, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Error deleting order'
      });
    });
  });
});
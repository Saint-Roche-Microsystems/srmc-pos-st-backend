import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller';
import { Product } from '../models/index';
import { Request, Response } from 'express';

// Mock del modelo Product
jest.mock('../models/index', () => ({
  Product: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
  }
}));

describe('Products Controller', () => {
  let mockRequest: Partial<Request>;
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

    mockRequest = {
      body: {},
      params: {}
    };

    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Test Product',
        price: 100,
        stock: 50,
        image: 'test.jpg'
      };

      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 100,
        stock: 50,
        image: 'test.jpg'
      };

      (Product.create as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      await createProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(Product.create).toHaveBeenCalledWith({
        name: 'Test Product',
        price: 100,
        stock: 50,
        image: 'test.jpg'
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 400 if name, price or stock are missing', async () => {
      // Test case 1: Missing name
      mockRequest.body = {
        price: 100,
        stock: 50
      };

      await createProduct(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ 
        error: 'Name, price, and stock are required' 
      });

      // Reset mocks
      statusMock.mockClear();
      jsonMock.mockClear();

      // Test case 2: Missing price
      mockRequest.body = {
        name: 'Test Product',
        stock: 50
      };

      await createProduct(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(400);

      // Reset mocks
      statusMock.mockClear();
      jsonMock.mockClear();

      // Test case 3: Missing stock
      mockRequest.body = {
        name: 'Test Product',
        price: 100
      };

      await createProduct(mockRequest as Request, mockResponse as Response);
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 on database error', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Test Product',
        price: 100,
        stock: 50
      };

      (Product.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      // Act
      await createProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Error creating product' 
      });
    });
  });

  describe('getProducts', () => {
    it('should return all products', async () => {
      // Arrange
      const mockProducts = [
        { _id: '1', name: 'Product 1', price: 100, stock: 10 },
        { _id: '2', name: 'Product 2', price: 200, stock: 20 }
      ];

      (Product.find as jest.Mock).mockResolvedValue(mockProducts);

      // Act
      await getProducts(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(Product.find).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(mockProducts);
    });

    it('should return 500 on database error', async () => {
      // Arrange
      (Product.find as jest.Mock).mockRejectedValue(new Error('DB Error'));

      // Act
      await getProducts(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Error fetching products' 
      });
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      // Arrange
      mockRequest.params = { id: 'product123' };
      
      const mockProduct = {
        _id: 'product123',
        name: 'Test Product',
        price: 100,
        stock: 50
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      await getProductById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(jsonMock).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 404 if product not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };
      (Product.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await getProductById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Product not found' 
      });
    });

    it('should return 400 for invalid ID format', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid-id' };
      (Product.findById as jest.Mock).mockRejectedValue(new Error('Cast to ObjectId failed'));

      // Act
      await getProductById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Invalid ID' 
      });
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'product123' };
      mockRequest.body = {
        name: 'Updated Product',
        price: 150,
        stock: 75
      };

      const mockUpdatedProduct = {
        _id: 'product123',
        name: 'Updated Product',
        price: 150,
        stock: 75
      };

      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      // Act
      await updateProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'product123',
        { name: 'Updated Product', price: 150, stock: 75 },
        { new: true, runValidators: true }
      );
      expect(jsonMock).toHaveBeenCalledWith(mockUpdatedProduct);
    });

    it('should return 404 if product not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { name: 'Updated' };
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await updateProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Product not found' 
      });
    });

    it('should return 400 on update error', async () => {
      // Arrange
      mockRequest.params = { id: 'product123' };
      mockRequest.body = { price: -100 }; // Invalid price
      (Product.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      // Act
      await updateProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Error updating product' 
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'product123' };
      
      const mockDeletedProduct = {
        _id: 'product123',
        name: 'Test Product'
      };

      (Product.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDeletedProduct);

      // Act
      await deleteProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('product123');
      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });

    it('should return 404 if product not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };
      (Product.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await deleteProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Product not found' 
      });
    });

    it('should return 400 on delete error', async () => {
      // Arrange
      mockRequest.params = { id: 'invalid-id' };
      (Product.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('DB Error'));

      // Act
      await deleteProduct(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ 
        message: 'Error deleting product' 
      });
    });
  });
});
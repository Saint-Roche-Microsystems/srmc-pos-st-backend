import { Request, Response } from "express";
import { Product } from "../models/index";
import { authMiddleware } from "../middlewares/auth.middleware";

// POST /products - Creates a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, price, stock, image } = req.body;

    if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product' });
  }
};

// GET /products - Retrieves the complete list of products
export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Invalid ID' });
  }
};

// PUT /products/:id - Update product details
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product' });
  }
};

// DELETE /products/:id - Permanently removes a product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error deleting product' });
  }
};

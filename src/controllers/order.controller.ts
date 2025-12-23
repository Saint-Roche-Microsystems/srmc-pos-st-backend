import { Request, Response } from 'express';
import { Order, Product, User } from '../models/index';
import { AuthRequest } from '../middlewares/auth.middleware';

const IVA = 0.15;

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { orderItems } = req.body;

    const userId = req.user!.id;

    // validate items array
    if (!orderItems || !Array.isArray(orderItems)) {
      return res.status(400).json({ message: 'Invalid items' });
    }

    if(orderItems.length === 0){
      return res.status(400).json({ message: 'No items provided' });
    }

    let subtotal = 0;

    // validate quantity and price, check stock
    for (const item of orderItems) {
      const { productId, quantity } = item;

      // look for the product
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (!quantity) {
        return res.status(400).json({ message: 'Quantity is required' });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          message: 'Quantity must be positive',
        });
      }

      if(!Number.isInteger(quantity)){
        return res.status(400).json({
          message: 'Quantity must be an integer',
        });
      }

      // Check product and its stock
      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${product.name}`,
        });
      }

      // put price in order item
      item.price = product.price;

      subtotal += quantity * product.price;
    }

    const total = subtotal + subtotal * IVA;

    // decrement stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // create order
    const order = await Order.create({
      userId,
      orderItems,
      total,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order' });
  }
};

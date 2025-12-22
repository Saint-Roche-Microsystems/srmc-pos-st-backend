import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Data Models ---

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    image?: string;
}

interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

interface Order {
    orderItems: OrderItem[];
    total: number;
}

// --- In-Memory Storage ---

let products: Product[] = [
    {
        id: uuidv4(),
        name: 'Sample Product 1',
        price: 19.99,
        stock: 100,
        image: 'https://via.placeholder.com/150'
    },
    {
        id: uuidv4(),
        name: 'Sample Product 2',
        price: 29.99,
        stock: 50,
        image: 'https://via.placeholder.com/150'
    }
];

// --- Endpoints ---

// 1. Products Module

// GET /products - Retrieves the complete list of products
app.get('/api/products', (req: Request, res: Response) => {
    res.json(products);
});

// POST /products - Creates a new product
app.post('/api/products', (req: Request, res: Response) => {
    const { name, price, stock, image } = req.body;

    if (!name || price === undefined || stock === undefined) {
        return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const newProduct: Product = {
        id: uuidv4(),
        name,
        price: Number(price),
        stock: Number(stock),
        image
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

// DELETE /products/:id - Permanently removes a product
app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === initialLength) {
        return res.status(404).json({ error: 'Product not found' });
    }

    res.status(204).send();
});

// PATCH /products/:id - Update product details
app.patch('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
        ...products[productIndex],
        ...updates,
        // Ensure id is not changed
        id: products[productIndex].id
    };

    products[productIndex] = updatedProduct;
    res.json(updatedProduct);
});

// 2. Sales / Order Module

// POST /orders - Processes a sale
app.post('/api/orders', (req: Request, res: Response) => {
    const { orderItems, total }: Order = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ error: 'Order items are required' });
    }

    // Check stock and reduce it
    const productsToUpdate = [];

    for (const item of orderItems) {
        const product = products.find(p => p.id === item.productId);

        if (!product) {
            return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
        }

        if (product.stock < item.quantity) {
            return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
        }

        productsToUpdate.push({ product, quantity: item.quantity });
    }

    // Commit stock reduction
    productsToUpdate.forEach(({ product, quantity }) => {
        product.stock -= quantity;
    });

    res.status(201).json({
        message: 'Order processed successfully',
        order: {
            orderItems,
            total,
            timestamp: new Date().toISOString()
        }
    });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

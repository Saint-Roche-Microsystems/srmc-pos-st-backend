import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Product, User, products, users, updateProducts } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key_123';

app.use(cors());
app.use(express.json());

// --- Data Models (Local Interfaces) ---

interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

interface Order {
    orderItems: OrderItem[];
    total: number;
}

// --- Middleware ---

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        (req as any).user = user;
        next();
    });
};

// --- Endpoints ---

// 0. Auth Module

// POST /auth/register - Register a new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
        id: uuidv4(),
        username,
        passwordHash
    };

    users.push(newUser);
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
});

// POST /auth/login - Log in and get a JWT
app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
        return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// 1. Products Module

// GET /products - Retrieves the complete list of products (Public)
app.get('/api/products', (req: Request, res: Response) => {
    res.json(products);
});

// POST /products - Creates a new product (Protected)
app.post('/api/products', authenticateToken, (req: Request, res: Response) => {
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

// DELETE /products/:id - Permanently removes a product (Protected)
app.delete('/api/products/:id', authenticateToken, (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLength = products.length;

    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    products.splice(index, 1);
    res.status(204).send();
});

// PATCH /products/:id - Update product details (Protected)
app.patch('/api/products/:id', authenticateToken, (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
        ...products[productIndex],
        ...updates,
        id: products[productIndex].id
    };

    products[productIndex] = updatedProduct;
    res.json(updatedProduct);
});

// 2. Sales / Order Module

// POST /orders - Processes a sale (Protected)
app.post('/api/orders', authenticateToken, (req: Request, res: Response) => {
    const { orderItems, total }: Order = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ error: 'Order items are required' });
    }

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

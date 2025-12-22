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
    { id: '1', name: 'Premium Coffee', price: 4.50, stock: 50, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop' },
    { id: '2', name: 'Avocado Toast', price: 12.00, stock: 20, image: 'https://www.allrecipes.com/thmb/8NccFzsaq0_OZPDKmf7Yee-aG78=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/AvocadoToastwithEggFranceC4x3-bb87e3bbf1944657b7db35f1383fabdb.jpg' },
    { id: '3', name: 'Green Smoothie', price: 7.50, stock: 30, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHqWWge9x5HL-88Ax3mJ1IhgN3meBvNIOh4Q&s' },
    { id: '4', name: 'Blueberry Muffin', price: 3.75, stock: 15, image: 'https://static01.nyt.com/images/2023/04/27/dining/03COOKING-JORDANMARSHMUFFIN2/03COOKING-JORDANMARSHMUFFIN2-threeByTwoMediumAt2X-v2.jpg' },
    { id: '5', name: 'Croissant', price: 3.25, stock: 25, image: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Croissant-Petr_Kratochvil.jpg' },
    { id: '6', name: 'Artisan Sourdough', price: 8.00, stock: 10, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQE9r-lTbqJKsW1nwiQTdVftDfHtIbyqbzyPQ&s' },
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

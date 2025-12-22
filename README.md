# SRMC-POS Backend API

A simple Express-based API for the SRMC-POS system.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Standard environment variables are in `.env`.

## Development

Run the server in development mode (with hot-reloading):
```bash
pnpm run dev
```

## Production

Build and start the server:
```bash
pnpm run build
pnpm start
```

## API Endpoints

### Products
- `GET /api/products`: List all products.
- `POST /api/products`: Create a new product.
- `PATCH /api/products/:id`: Update product details.
- `DELETE /api/products/:id`: Remove a product.

### Orders
- `POST /api/orders`: Process a sale and reduce stock.

## Data Models

### Product
```typescript
{
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
}
```

### Order
```typescript
{
  orderItems: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
}
```
# srmc-pos-st-backend

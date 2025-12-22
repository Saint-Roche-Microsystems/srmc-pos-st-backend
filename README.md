# SRMC-POS Backend API

A simple Express-based API for the SRMC-POS system with JWT Authentication.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configuration:
   The server uses a `.env` file for configuration. A default `JWT_SECRET` is used if not provided.

## Development

Run the server in development mode (with hot-reloading):
```bash
pnpm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
  - Body: `{ username, password }`
- `POST /api/auth/login`: Log in and receive a JWT.
  - Body: `{ username, password }`
  - Response: `{ token }`

### Products
- `GET /api/products`: List all products (Public).
- `POST /api/products`: Create a new product (**Requires Auth**).
- `PATCH /api/products/:id`: Update product details (**Requires Auth**).
- `DELETE /api/products/:id`: Remove a product (**Requires Auth**).

### Orders
- `POST /api/orders`: Process a sale and reduce stock (**Requires Auth**).

## Usage with Auth
For protected endpoints, include the JWT in the `Authorization` header:
`Authorization: Bearer <your_token>`

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

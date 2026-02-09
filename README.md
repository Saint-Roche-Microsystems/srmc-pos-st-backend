# SRMC-POS Backend API

A simple Express-based API for the SRMC-POS system with JWT Authentication.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configuration:
   The server uses a `.env` file for configuration. A default `JWT_SECRET` is used if not provided.

## Database

Generate the initial mongodb database setup with docker compose:
```bash
docker compose up -d
```

## Development

Run the server in development mode (with hot-reloading):
```bash
pnpm run dev
```

## Authentication

For protected endpoints, include the JWT in the `Authorization` header:
```
Authorization: Bearer <your_token>
```

---

## API Endpoints

### Authentication

All authentication endpoints are **public** (no authentication required).

#### Register a New User

**POST** `/api/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "userId": "string"
}
```

**Error Responses:**
- `400` - User already exists
- `500` - Error registering user

---

#### Login

**POST** `/api/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "token": "string",
  "username": "string"
}
```

**Error Responses:**
- `400` - Invalid username or password
- `500` - Error in login

---

### Products

All product endpoints **require authentication**.

#### Get All Products

**GET** `/api/products`

**Requires Auth**

Retrieves the complete list of products.

**Success Response (200):**
```json
[
  {
    "id": "string",
    "name": "string",
    "price": 0,
    "stock": 0,
    "image": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

**Error Responses:**
- `401` - Unauthorized (missing or invalid token)
- `500` - Error fetching products

---

#### Get Product by ID

**GET** `/api/products/:id`

**Requires Auth**

Retrieves a single product by its ID.

**URL Parameters:**
- `id` (string, required) - Product ID

**Success Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "price": 0,
  "stock": 0,
  "image": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**
- `400` - Invalid ID format
- `401` - Unauthorized (missing or invalid token)
- `404` - Product not found

---

#### Create Product

**POST** `/api/products`

**Requires Auth**

Creates a new product.

**Request Body:**
```json
{
  "name": "string",
  "price": 0,
  "stock": 0,
  "image": "string (optional)"
}
```

**Validation:**
- `name` - Required, string
- `price` - Required, number, minimum 0
- `stock` - Required, integer, minimum 0
- `image` - Optional, string

**Success Response (201):**
```json
{
  "id": "string",
  "name": "string",
  "price": 0,
  "stock": 0,
  "image": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**
- `400` - Name, price, and stock are required / Error creating product
- `401` - Unauthorized (missing or invalid token)

---

#### Update Product

**PUT** `/api/products/:id`

**Requires Auth**

Updates an existing product.

**URL Parameters:**
- `id` (string, required) - Product ID

**Request Body:**
```json
{
  "name": "string (optional)",
  "price": 0,
  "stock": 0,
  "image": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "price": 0,
  "stock": 0,
  "image": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**
- `400` - Error updating product
- `401` - Unauthorized (missing or invalid token)
- `404` - Product not found

---

#### Delete Product

**DELETE** `/api/products/:id`

**Requires Auth**

Permanently removes a product.

**URL Parameters:**
- `id` (string, required) - Product ID

**Success Response (204):**
No content

**Error Responses:**
- `400` - Error deleting product
- `401` - Unauthorized (missing or invalid token)
- `404` - Product not found

---

### Orders

All order endpoints **require authentication**.

#### Create Order

**POST** `/api/orders`

**Requires Auth**

Creates a new order and reduces product stock automatically. Calculates total with 15% IVA tax.

**Request Body:**
```json
{
  "orderItems": [
    {
      "productId": "string",
      "quantity": 0
    }
  ]
}
```

**Validation:**
- `orderItems` - Required, array with at least one item
- `productId` - Required, must exist in database
- `quantity` - Required, positive integer
- Stock must be sufficient for all items

**Success Response (201):**
```json
{
  "id": "string",
  "userId": "string",
  "orderItems": [
    {
      "productId": "string",
      "quantity": 0,
      "price": 0
    }
  ],
  "total": 0,
  "createdAt": "string",
  "updatedAt": "string"
}
```

**Error Responses:**
- `400` - Invalid items / No items provided / Quantity must be positive / Quantity must be an integer / Insufficient stock for product
- `401` - Unauthorized (missing or invalid token)
- `404` - Product not found
- `500` - Error creating order

**Notes:**
- Price is automatically calculated from the product price
- Total includes 15% IVA tax
- Product stock is automatically reduced

---

#### Get My Orders

**GET** `/api/orders/my`

**Requires Auth**

Retrieves all orders belonging to the authenticated user, sorted by creation date (newest first).

**Success Response (200):**
```json
[
  {
    "id": "string",
    "userId": "string",
    "orderItems": [
      {
        "productId": {
          "name": "string"
        },
        "quantity": 0,
        "price": 0
      }
    ],
    "total": 0,
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

**Error Responses:**
- `401` - Unauthorized (missing or invalid token)
- `500` - Error fetching orders

**Notes:**
- Returns orders populated with product names
- Sorted by creation date (descending)

---

#### Delete Order

**DELETE** `/api/orders/:id`

**Requires Auth**

Deletes an order. Only the order owner can delete their own orders.

**URL Parameters:**
- `id` (string, required) - Order ID

**Success Response (204):**
No content

**Error Responses:**
- `401` - Unauthorized (missing or invalid token)
- `403` - You do not own this order
- `404` - Order not found
- `500` - Error deleting order

**Notes:**
- Users can only delete their own orders
- Does not restore product stock

---

## Data Models

### User
```typescript
{
  username: string;
  passwordHash: string;
}
```

### Product
```typescript
{
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Order
```typescript
{
  id: string;
  userId: string;
  orderItems: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Example Usage

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "password": "secret123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "password": "secret123"}'
```

### 3. Create a Product (with token)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Laptop", "price": 999.99, "stock": 10}'
```

### 4. Create an Order (with token)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"orderItems": [{"productId": "PRODUCT_ID", "quantity": 2}]}'
```

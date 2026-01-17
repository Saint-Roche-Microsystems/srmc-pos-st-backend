import http from 'k6/http';
import { check, sleep } from 'k6';

// ==============================
// CONFIGURACIÓN DE LA PRUEBA
// ==============================
export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 100 },
    { duration: '10s', target: 0 }
  ],
  thresholds: {
    'http_req_duration{method:GET}': ['p(95)<300'],
    'http_req_duration{method:POST}': ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

// URL base del backend
const BASE_URL = 'http://localhost:3000';

// ==============================
// SETUP: AUTENTICACIÓN UNA SOLA VEZ
// ==============================
export function setup() {
  const credentials = {
    username: 'load_test_user',
    password: '123456',
  };

  const payload = JSON.stringify(credentials);

  // Register (puede fallar si ya existe, es aceptable)
  http.post(`${BASE_URL}/api/auth/register`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'token received': (r) => JSON.parse(r.body).token !== undefined,
  });

  const token = JSON.parse(loginRes.body).token;

  return { token };
}

// ==============================
// FUNCIÓN PRINCIPAL
// ==============================
export default function (data) {
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  };

  // ==============================
  // GET PRODUCTS (AUTH REQUIRED)
  // ==============================
  const productsRes = http.get(
    `${BASE_URL}/api/products`,
    authHeaders
  );

  check(productsRes, {
    'get products status is 200': (r) => r.status === 200,
  });

  // ==============================
  // CREATE PRODUCT (AUTH)
  // ==============================
  const productPayload = JSON.stringify({
    name: `Product_${__VU}_${__ITER}`,
    price: 10 + __VU,
    stock: 50,
  });

  const createProductRes = http.post(
    `${BASE_URL}/api/products`,
    productPayload,
    authHeaders
  );

  check(createProductRes, {
    'create product status is 201': (r) => r.status === 201,
  });

  const productId = JSON.parse(createProductRes.body).id;

  // ==============================
  // CREATE ORDER (AUTH)
  // ==============================
  const orderPayload = JSON.stringify({
    orderItems: [
      {
        productId,
        quantity: 2,
        price: 10 + __VU,
      },
    ],
    total: (10 + __VU) * 2,
  });

  const orderRes = http.post(
    `${BASE_URL}/api/orders`,
    orderPayload,
    authHeaders
  );

  check(orderRes, {
    'order status is 200 or 201': (r) =>
      r.status === 200 || r.status === 201,
  });

  // ==============================
  // PAUSA REALISTA
  // ==============================
  sleep(1);
}
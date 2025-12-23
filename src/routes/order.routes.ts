import { Router } from 'express';
import { createOrder, getMyOrders, deleteOrder } from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post("/", authMiddleware, createOrder);
router.get("/my", authMiddleware, getMyOrders);
router.delete("/:id", authMiddleware, deleteOrder);

export default router;

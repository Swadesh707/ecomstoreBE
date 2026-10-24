import express from "express"
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  getOrderByTracking,
  getUserOrders,
  updateOrderStatus,
  cancelUserOrder,
  requestOrderReturn,
  updateReturnStatus,
  getAnalyticsSummary,
} from "../controllers/orderController.js"
import {
  verifyToken,
  optionalAuth,
  requireAdmin,
  requireStaff,
  requireLogisticsOrAdmin,
} from "../middlewares/authMiddleware.js"

const router = express.Router()

router.post("/", optionalAuth, createOrder)
router.post("/create", optionalAuth, createOrder)
router.post("/confirm", optionalAuth, createOrder)

router.get("/all", verifyToken, requireStaff, getAllOrders)
router.get("/analytics/summary", verifyToken, requireAdmin, getAnalyticsSummary)
router.get("/user/my-orders", verifyToken, getUserOrders)
router.get("/track/:trackingNumber", getOrderByTracking)
router.get("/number/:orderNumber", getOrderByNumber)
router.put("/:id/status", verifyToken, requireLogisticsOrAdmin, updateOrderStatus)
router.post("/:id/cancel", cancelUserOrder)
router.put("/:id/cancel", cancelUserOrder)
router.post("/:id/return", requestOrderReturn)
router.post("/:id/return-request", requestOrderReturn)
router.put("/:id/return-status", verifyToken, requireLogisticsOrAdmin, updateReturnStatus)
router.get("/:id", getOrderById)

export default router

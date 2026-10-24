import express from "express"
import {
  createOrder,
  createInStoreBill,
  updateInStoreBill,
  deleteInStoreBill,
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

router.post("/", verifyToken, createOrder)
router.post("/create", verifyToken, createOrder)
router.post("/confirm", verifyToken, createOrder)
router.post("/in-store-bill", verifyToken, requireStaff, createInStoreBill)
router.put("/in-store-bill/:id", verifyToken, requireStaff, updateInStoreBill)
router.delete("/in-store-bill/:id", verifyToken, requireStaff, deleteInStoreBill)
router.delete("/:id", verifyToken, requireStaff, deleteInStoreBill)

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

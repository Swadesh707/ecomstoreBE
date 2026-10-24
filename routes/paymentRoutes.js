import express from "express"
import {
  getAllPayments,
  getPaymentById,
  getPaymentByOrderNumber,
} from "../controllers/paymentController.js"
import {
  verifyToken,
  requireSalesOrAdmin,
  requireStaff,
} from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/all", verifyToken, requireSalesOrAdmin, getAllPayments)
router.get("/order/:orderNumber", verifyToken, requireStaff, getPaymentByOrderNumber)
router.get("/:id", verifyToken, requireStaff, getPaymentById)

export default router

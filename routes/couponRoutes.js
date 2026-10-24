import express from "express"
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController.js"
import { verifyToken, requireAdmin, requireSalesOrAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/", verifyToken, requireSalesOrAdmin, getAllCoupons)
router.post("/", verifyToken, requireSalesOrAdmin, createCoupon)
router.put("/:id", verifyToken, requireSalesOrAdmin, updateCoupon)
router.delete("/:id", verifyToken, requireAdmin, deleteCoupon)
router.post("/validate", validateCoupon)

export default router

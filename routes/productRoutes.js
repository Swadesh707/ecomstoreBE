import express from "express"
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productControllers.js"
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/", getAllProducts)
router.get("/:id", getProductById)
router.post("/", verifyToken, requireAdmin, createProduct)
router.put("/:id", verifyToken, requireAdmin, updateProduct)
router.delete("/:id", verifyToken, requireAdmin, deleteProduct)

export default router

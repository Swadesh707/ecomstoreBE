import express from "express"
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js"

import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/getAll", getAllCategories)
router.post("/create", verifyToken, requireAdmin, createCategory)
router.put("/:id", verifyToken, requireAdmin, updateCategory)
router.delete("/:id", verifyToken, requireAdmin, deleteCategory)

export default router

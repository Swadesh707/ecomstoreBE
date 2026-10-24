import express from "express"
import {
  getAllUserCategories,
  createUserCategory,
  updateUserCategory,
  deleteUserCategory,
} from "../controllers/userCategoryController.js"
import { optionalAuth, verifyToken, requireAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/", optionalAuth, getAllUserCategories)
router.get("/all", optionalAuth, getAllUserCategories)
router.post("/", verifyToken, requireAdmin, createUserCategory)
router.post("/create", verifyToken, requireAdmin, createUserCategory)
router.put("/:id", verifyToken, requireAdmin, updateUserCategory)
router.delete("/:id", verifyToken, requireAdmin, deleteUserCategory)

export default router

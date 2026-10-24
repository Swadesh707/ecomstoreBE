import express from "express"
import {
  createUser,
  createStaffUser,
  claimAdmin,
  login,
  getUserWishlist,
  toggleWishlistItem,
  syncWishlist,
  getAllUsers,
  getUserCategories,
  updateUserRole,
  deleteUser,
} from "../controllers/userController.js"
import { verifyToken, optionalAuth, requireAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/categories", optionalAuth, getUserCategories)
router.get("/category", optionalAuth, getUserCategories)
router.get("/roles", optionalAuth, getUserCategories)
router.post("/create", createUser)
router.post("/create-staff", verifyToken, requireAdmin, createStaffUser)
router.post("/claim-admin", optionalAuth, claimAdmin)
router.post("/login", login)

router.get("/all", verifyToken, requireAdmin, getAllUsers)
router.get("/", verifyToken, requireAdmin, getAllUsers)
router.put("/:id/role", verifyToken, requireAdmin, updateUserRole)
router.delete("/:id", verifyToken, requireAdmin, deleteUser)

router.get("/wishlist", verifyToken, getUserWishlist)
router.post("/wishlist/toggle", verifyToken, toggleWishlistItem)
router.post("/wishlist/sync", verifyToken, syncWishlist)

export default router

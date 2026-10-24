import express from "express"
import {
  getWishlistByUserId,
  getAllWishlists,
  syncWishlistBucket,
} from "../controllers/wishlistController.js"
import { verifyToken, optionalAuth, requireAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

router.get("/all", verifyToken, requireAdmin, getAllWishlists)
router.get("/user/:userId", optionalAuth, getWishlistByUserId)
router.get("/my", verifyToken, getWishlistByUserId)
router.post("/sync", optionalAuth, syncWishlistBucket)

export default router

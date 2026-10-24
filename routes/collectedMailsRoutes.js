import express from "express"
import {
  subscribeMail,
  getAllCollectedMails,
  deleteCollectedMail,
} from "../controllers/collectedMailsController.js"
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

// Public subscription endpoints
router.post("/", subscribeMail)
router.post("/subscribe", subscribeMail)

// Admin management endpoints
router.get("/", verifyToken, requireAdmin, getAllCollectedMails)
router.post("/admin-add", verifyToken, requireAdmin, subscribeMail)
router.delete("/:id", verifyToken, requireAdmin, deleteCollectedMail)

export default router

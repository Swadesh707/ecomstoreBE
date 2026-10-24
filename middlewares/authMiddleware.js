import jwt from "jsonwebtoken"
import { jwtSecret } from "../controllers/userController.js"

export const verifyToken = async(req,res,next)=> {

   try {
     const headers = req.headers.authorization
     if (!headers) {
       return res.status(401).json({
         message: 'Token is missing'
       })
     }
     const token = headers.split(" ")[1]

     const decoded = jwt.verify(token,jwtSecret)

     if(!decoded){
         return res.status(401).json({
             message : 'Token is invalid or expired'
         })
     }
     
     req.user = decoded
     next()
   }
   catch(err) {
      return res.status(401).json({
            message : 'Token is invalid or expired'
        })
   }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const headers = req.headers.authorization
    if (headers) {
      const token = headers.split(" ")[1]
      if (token) {
        const decoded = jwt.verify(token, jwtSecret)
        if (decoded) {
          req.user = decoded
        }
      }
    }
  } catch (err) {
    // Continue without token if invalid
  }
  next()
}

export const requireAdmin = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase().trim()
  if (role !== "admin") {
    return res.status(403).json({ message: "Access denied: Administrator authorization required." })
  }
  next()
}

export const requireSalesOrAdmin = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase().trim()
  if (role !== "admin" && role !== "salesperson") {
    return res.status(403).json({ message: "Access denied: Salesperson privileges required." })
  }
  next()
}

export const requireLogisticsOrAdmin = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase().trim()
  if (role !== "admin" && role !== "logistics") {
    return res.status(403).json({ message: "Access denied: Logistics privileges required." })
  }
  next()
}

export const requireStaff = (req, res, next) => {
  const role = (req.user?.role || "").toLowerCase().trim()
  const staffRoles = ["admin", "salesperson", "logistics"]
  if (!staffRoles.includes(role)) {
    return res.status(403).json({ message: "Access denied: Staff authorization required." })
  }
  next()
}

import User from "../model/user.js"
import Wishlist from "../model/Wishlist.js"
import Product from "../model/Product.js"
import UserCategory, { DEFAULT_USER_CATEGORIES } from "../model/UserCategory.js"
import { sendOtpEmail } from "../services/emailService.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config({ quiet: true })
export const jwtSecret = process.env.JWT_SECRET || "ecomstore_secret_token_key_2026"

export const VALID_ROLES = ["admin", "salesperson", "logistics", "user"]

export const ROLE_CATEGORY_MAP = {
  admin: "Admin",
  salesperson: "Salesperson",
  logistics: "Logistics",
  user: "User",
}

export const getUserCategories = async (req, res) => {
  try {
    let categories = await UserCategory.find().sort({ createdAt: 1 })
    if (categories.length === 0) {
      await UserCategory.insertMany(DEFAULT_USER_CATEGORIES)
      categories = await UserCategory.find().sort({ createdAt: 1 })
    }
    res.json(categories)
  } catch (err) {
    console.error("Error retrieving user categories:", err)
    res.status(500).json({ message: "Failed to retrieve user categories from database." })
  }
}

export const createUser = async (req, res) => {
  try {
    const password = req.body.password
    const emailfrombody = req.body.email

    const role = "user"

    if (!emailfrombody || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      })
    }

    const existingEmail = await User.findOne({ email: emailfrombody.toLowerCase().trim() })

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists",
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const createdUser = await User.create({
      fullName: req.body.fullName || req.body.name || "Client Patron",
      email: emailfrombody.toLowerCase().trim(),
      role: role,
      userCategory: "User",
      password: hashedPassword,
    })

    const token = jwt.sign(
      {
        id: createdUser._id,
        email: createdUser.email,
        name: createdUser.fullName,
        role: createdUser.role,
      },
      jwtSecret,
      { expiresIn: "30d" }
    )

    res.json({
      message: "User registered successfully",
      id: createdUser._id,
      fullName: createdUser.fullName,
      email: createdUser.email,
      role: createdUser.role,
      userCategory: createdUser.userCategory,
      image: createdUser.image,
      token: token,
    })
  } catch (err) {
    console.error("Create user error:", err)
    res.status(500).json({ message: "Error creating user" })
  }
}

export const createStaffUser = async (req, res) => {
  try {
    const { fullName, email, password, role, phone, address } = req.body

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required." })
    }

    const cleanEmail = email.toLowerCase().trim()
    const existing = await User.findOne({ email: cleanEmail })
    if (existing) {
      return res.status(400).json({ message: `An account with email "${cleanEmail}" already exists.` })
    }

    const dbCategories = await UserCategory.find()
    const availableRoles = [
      ...new Set([
        ...dbCategories.map((c) => c.roleKey || c.name),
        ...VALID_ROLES,
      ]),
    ]

    const targetRole = (role || "user").toLowerCase()
    const assignedRole = availableRoles.includes(targetRole) ? targetRole : "user"

    let assignedCategoryTitle = "User"
    const matchedCategory = dbCategories.find(
      (c) =>
        (c.roleKey && c.roleKey.toLowerCase() === assignedRole) ||
        (c.name && c.name.toLowerCase() === assignedRole)
    )
    if (matchedCategory) {
      assignedCategoryTitle = matchedCategory.title
    } else if (ROLE_CATEGORY_MAP[assignedRole]) {
      assignedCategoryTitle = ROLE_CATEGORY_MAP[assignedRole]
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
      userCategory: assignedCategoryTitle,
      phone: phone || "",
      address: typeof address === "string" ? address : address?.street || "",
      city: address?.city || "",
      zip: address?.zip || "",
      country: address?.country || "United States",
      status: "Active",
    })

    const sanitized = await User.findById(newUser._id, "-password")
    res.status(201).json({
      message: `Account for ${fullName} designated with category "${assignedCategoryTitle}" successfully provisioned.`,
      user: sanitized,
    })
  } catch (err) {
    console.error("Create staff error:", err)
    res.status(500).json({ message: "Failed to provision staff account." })
  }
}

export const claimAdmin = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || req.body.id
    const userEmail = req.user?.email || req.body.email

    let user = null
    if (userId) {
      user = await User.findById(userId)
    } else if (userEmail) {
      user = await User.findOne({ email: userEmail.toLowerCase().trim() })
    }

    if (!user) {
      return res.status(404).json({ message: "User account not found to promote." })
    }

    user.role = "admin"
    user.userCategory = "Admin"
    user.status = "Active"
    await user.save()

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.fullName,
        role: "admin",
      },
      jwtSecret,
      { expiresIn: "30d" }
    )

    res.json({
      message: `Account ${user.email} successfully designated as Admin.`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: "admin",
        userCategory: "Admin",
      },
      token,
    })
  } catch (err) {
    console.error("Claim admin error:", err)
    res.status(500).json({ message: "Failed to promote account." })
  }
}

export const login = async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({
        message: "Email or password incorrect",
      })
    }

    const resolvedRole = (user.role || "").toLowerCase().includes("admin") ? "admin" : (user.role || "user")
    const resolvedCategory = (user.userCategory || "").toLowerCase().includes("admin") ? "Admin" : (user.userCategory || "User")

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.fullName,
        role: resolvedRole,
      },
      jwtSecret,
      { expiresIn: "30d" }
    )

    const finalResponse = {
      message: "Logged in successfully",
      email: user.email,
      fullName: user.fullName,
      role: resolvedRole,
      userCategory: resolvedCategory,
      image: user.image,
      id: user._id,
      token: token,
    }

    res.json(finalResponse)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error logging in" })
  }
}

export const getUserWishlist = async (req, res) => {
  try {
    const wishlistDoc = await Wishlist.findOne({ userId: req.user.id }).populate("items.productId")
    if (!wishlistDoc || !wishlistDoc.items) {
      return res.json([])
    }
    const products = wishlistDoc.items
      .map((item) => {
        if (item.productId && typeof item.productId === "object") {
          return item.productId
        }
        return {
          _id: item.productId,
          title: item.title,
          price: item.price,
          category: item.category,
          image: item.image,
        }
      })
      .filter(Boolean)
    return res.json(products)
  } catch (err) {
    console.error("Fetch wishlist error:", err)
    return res.status(500).json({ message: "Failed to fetch wishlist" })
  }
}

export const toggleWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" })
    }

    const prod = await Product.findById(productId)
    if (!prod) {
      return res.status(404).json({ message: "Product not found" })
    }

    let wishlistDoc = await Wishlist.findOne({ userId: req.user.id })
    if (!wishlistDoc) {
      wishlistDoc = new Wishlist({
        userId: req.user.id,
        userEmail: req.user.email || "",
        items: [],
        totalItems: 0,
      })
    }

    const index = wishlistDoc.items.findIndex(
      (i) => i.productId?.toString() === productId.toString()
    )

    let isAdded = false
    if (index > -1) {
      wishlistDoc.items.splice(index, 1)
      isAdded = false
    } else {
      wishlistDoc.items.push({
        productId: prod._id,
        title: prod.title || prod.name || "",
        price: prod.price || 0,
        category: prod.category || "Tailoring",
        image: prod.image || "",
        addedAt: new Date(),
      })
      isAdded = true
    }

    wishlistDoc.totalItems = wishlistDoc.items.length
    await wishlistDoc.save()

    const populated = await Wishlist.findById(wishlistDoc._id).populate("items.productId")
    const returnedList = populated.items
      .map((i) =>
        i.productId && typeof i.productId === "object"
          ? i.productId
          : {
              _id: i.productId,
              title: i.title,
              price: i.price,
              category: i.category,
              image: i.image,
            }
      )
      .filter(Boolean)

    return res.json({ added: isAdded, wishlist: returnedList })
  } catch (err) {
    console.error("Toggle wishlist error:", err)
    return res.status(500).json({ message: "Failed to update wishlist" })
  }
}

export const syncWishlist = async (req, res) => {
  try {
    const { productIds } = req.body
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: "Product IDs must be an array" })
    }

    let wishlistDoc = await Wishlist.findOne({ userId: req.user.id })
    if (!wishlistDoc) {
      wishlistDoc = new Wishlist({
        userId: req.user.id,
        userEmail: req.user.email || "",
        items: [],
        totalItems: 0,
      })
    }

    const existingIds = wishlistDoc.items.map((i) => i.productId?.toString())
    for (const pid of productIds) {
      if (pid && !existingIds.includes(pid.toString())) {
        const prod = await Product.findById(pid)
        if (prod) {
          wishlistDoc.items.push({
            productId: prod._id,
            title: prod.title || prod.name || "",
            price: prod.price || 0,
            category: prod.category || "Tailoring",
            image: prod.image || "",
            addedAt: new Date(),
          })
          existingIds.push(pid.toString())
        }
      }
    }

    wishlistDoc.totalItems = wishlistDoc.items.length
    await wishlistDoc.save()

    const populated = await Wishlist.findById(wishlistDoc._id).populate("items.productId")
    const returnedList = populated.items
      .map((i) =>
        i.productId && typeof i.productId === "object"
          ? i.productId
          : {
              _id: i.productId,
              title: i.title,
              price: i.price,
              category: i.category,
              image: i.image,
            }
      )
      .filter(Boolean)

    return res.json({ wishlist: returnedList })
  } catch (err) {
    console.error("Sync wishlist error:", err)
    return res.status(500).json({ message: "Failed to sync wishlist" })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const totalUsersInDb = await User.countDocuments()
    if (totalUsersInDb === 0) {
      const defaultHash = await bcrypt.hash("admin", 10)
      await User.create({
        fullName: "admin",
        email: "admin@gmail.com",
        password: defaultHash,
        role: "admin",
        userCategory: "Admin",
        status: "Active",
      })
    }

    const { role, search } = req.query
    const conditions = []

    if (role && role !== "All" && role !== "all") {
      const cleanRole = role.trim().toLowerCase()
      if (cleanRole === "admin") {
        conditions.push({
          $or: [
            { role: { $in: ["admin", "Admin"] } },
            { userCategory: { $regex: /admin/i } },
          ],
        })
      } else if (cleanRole === "user") {
        conditions.push({
          $or: [
            { role: { $in: ["user", "User", "consumer", "Consumer"] } },
            { userCategory: { $regex: /^user$/i } },
          ],
        })
      } else {
        conditions.push({
          $or: [
            { role: { $regex: new RegExp(`^${cleanRole}$`, "i") } },
            { userCategory: { $regex: new RegExp(`^${cleanRole}$`, "i") } },
          ],
        })
      }
    }

    if (search && search.trim()) {
      const q = search.trim()
      conditions.push({
        $or: [
          { fullName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { role: { $regex: q, $options: "i" } },
          { userCategory: { $regex: q, $options: "i" } },
        ],
      })
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {}
    const users = await User.find(filter, "-password").sort({ createdAt: -1 })
    const sanitized = users.map((u) => {
      const obj = u.toObject ? u.toObject() : { ...u }
      if (obj.role && obj.role.toLowerCase().includes("admin")) {
        obj.role = "admin"
        obj.userCategory = "Admin"
      }
      return obj
    })
    res.json(sanitized)
  } catch (err) {
    console.error("Error fetching users from database:", err)
    res.status(500).json({ message: "Failed to retrieve user accounts from database." })
  }
}

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role, status } = req.body

    const updateFields = {}

    if (role) {
      const dbCategories = await UserCategory.find()
      const availableRoles = [
        ...new Set([
          ...dbCategories.map((c) => c.roleKey || c.name),
          ...VALID_ROLES,
        ]),
      ]

      const targetRole = role.toLowerCase()
      if (!availableRoles.includes(targetRole)) {
        return res.status(400).json({
          message: `Invalid role specified. Must be one of database categories: ${availableRoles.join(", ")}`,
        })
      }

      let categoryTitle = "User"
      const matched = dbCategories.find(
        (c) =>
          (c.roleKey && c.roleKey.toLowerCase() === targetRole) ||
          (c.name && c.name.toLowerCase() === targetRole)
      )
      if (matched) {
        categoryTitle = matched.title
      } else if (ROLE_CATEGORY_MAP[targetRole]) {
        categoryTitle = ROLE_CATEGORY_MAP[targetRole]
      }

      updateFields.role = targetRole
      updateFields.userCategory = categoryTitle
    }

    if (status !== undefined) updateFields.status = status

    const updated = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      select: "-password",
    })

    if (!updated) {
      return res.status(404).json({ message: "User not found." })
    }

    res.json(updated)
  } catch (err) {
    console.error("Error updating user role:", err)
    res.status(500).json({ message: "Failed to update user role." })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await User.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ message: "Account not found." })
    }
    await Wishlist.deleteMany({ userId: id })
    res.json({ message: "Account removed successfully." })
  } catch (err) {
    console.error("Error deleting user:", err)
    res.status(500).json({ message: "Failed to remove user account." })
  }
}

const forgotPasswordRateLimits = new Map()

export const forgotPassword = async (req, res) => {
  try {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown"
    const now = Date.now()
    const record = forgotPasswordRateLimits.get(clientIp) || { count: 0, resetTime: now + 15 * 60 * 1000 }

    if (now > record.resetTime) {
      record.count = 0
      record.resetTime = now + 15 * 60 * 1000
    }

    if (record.count >= 5) {
      return res.status(429).json({
        message: "Too many reset requests from this network. Please wait 15 minutes before retrying.",
      })
    }

    const { email } = req.body
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Please provide a valid email address." })
    }

    const cleanEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: cleanEmail })

    record.count += 1
    forgotPasswordRateLimits.set(clientIp, record)

    if (!user) {

      return res.json({
        message: "If an account matches that email address, a 6-digit verification code has been dispatched.",
      })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.resetOtp = otp
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    user.failedOtpAttempts = 0
    await user.save()

    try {
      await sendOtpEmail(user.email, otp)
    } catch (emailErr) {
      console.error("Mailtrap dispatch error:", emailErr)
      return res.status(500).json({ message: "Failed to dispatch verification email. Please try again." })
    }

    return res.json({
      message: "If an account matches that email address, a 6-digit verification code has been dispatched.",
    })
  } catch (err) {
    console.error("Forgot password error:", err)
    return res.status(500).json({ message: "Server encountered an error processing your request." })
  }
}

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code are required." })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ message: "Invalid or expired verification session." })
    }

    if (new Date() > new Date(user.resetOtpExpiry)) {
      user.resetOtp = null
      user.resetOtpExpiry = null
      await user.save()
      return res.status(400).json({ message: "Verification code has expired. Please request a new code." })
    }

    if (user.failedOtpAttempts >= 5) {
      user.resetOtp = null
      user.resetOtpExpiry = null
      await user.save()
      return res.status(400).json({
        message: "Too many failed attempts. Code has been invalidated for security. Please request a new one.",
      })
    }

    if (user.resetOtp !== String(otp).trim()) {
      user.failedOtpAttempts = (user.failedOtpAttempts || 0) + 1
      await user.save()
      return res.status(400).json({
        message: `Incorrect verification code. ${5 - user.failedOtpAttempts} attempts remaining.`,
      })
    }

    return res.json({ success: true, message: "Verification code confirmed." })
  } catch (err) {
    console.error("Verify OTP error:", err)
    return res.status(500).json({ message: "Failed to verify code." })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required to reset your password." })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters in length." })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ message: "Invalid or expired verification session." })
    }

    if (new Date() > new Date(user.resetOtpExpiry)) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new code." })
    }

    if (user.resetOtp !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid verification code." })
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10)
    user.password = hashedPassword
    user.resetOtp = null
    user.resetOtpExpiry = null
    user.failedOtpAttempts = 0
    await user.save()

    return res.json({
      success: true,
      message: "Your password has been successfully reset. Please sign in with your new credentials.",
    })
  } catch (err) {
    console.error("Reset password error:", err)
    return res.status(500).json({ message: "Failed to reset password. Please try again." })
  }
}

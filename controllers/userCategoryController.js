import UserCategory from "../model/UserCategory.js"

export const DEFAULT_USER_CATEGORIES = [
  {
    name: "admin",
    title: "Admin",
    roleKey: "admin",
    description: "Overall administration, executive analytics, product catalog, user database, and full store governance.",
    permissions: ["all"],
    status: true,
  },
  {
    name: "salesperson",
    title: "Salesperson",
    roleKey: "salesperson",
    description: "Generates invoices and client bills, reviews patron commissions, and applies promotional codes.",
    permissions: ["invoices", "orders", "coupons"],
    status: true,
  },
  {
    name: "logistics",
    title: "Logistics",
    roleKey: "logistics",
    description: "Courier dispatch management, carrier tracking code assignment, freight expenses, and delivery fulfillment.",
    permissions: ["logistics", "dispatch", "tracking", "returns"],
    status: true,
  },
  {
    name: "user",
    title: "User",
    roleKey: "user",
    description: "Standard storefront patron browsing collection, archive wishlist, and placing commissions.",
    permissions: ["shop", "checkout", "wishlist"],
    status: true,
  },
]

export const getAllUserCategories = async (req, res) => {
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

export const createUserCategory = async (req, res) => {
  try {
    const { name, title, description, roleKey, permissions, status } = req.body
    const resolvedTitle = (title || name || "").trim()
    const cleanName = (name || title || "").toLowerCase().trim().replace(/\s+/g, "-")

    if (!cleanName || !resolvedTitle) {
      return res.status(400).json({ message: "Category name and title are required." })
    }

    const existing = await UserCategory.findOne({ name: cleanName })
    if (existing) {
      return res.status(400).json({ message: `User category "${cleanName}" already exists.` })
    }

    const newCat = await UserCategory.create({
      name: cleanName,
      title: resolvedTitle,
      description: description || "",
      roleKey: roleKey || cleanName,
      permissions: Array.isArray(permissions) ? permissions : [],
      status: status !== undefined ? Boolean(status) : true,
    })

    res.status(201).json(newCat)
  } catch (err) {
    console.error("Error creating user category:", err)
    res.status(500).json({ message: "Failed to create user category in database." })
  }
}

export const updateUserCategory = async (req, res) => {
  try {
    const { id } = req.params
    const updated = await UserCategory.findByIdAndUpdate(id, req.body, { new: true })
    if (!updated) {
      return res.status(404).json({ message: "User category not found." })
    }
    res.json(updated)
  } catch (err) {
    console.error("Error updating user category:", err)
    res.status(500).json({ message: "Failed to update user category." })
  }
}

export const deleteUserCategory = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await UserCategory.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ message: "User category not found." })
    }
    res.json({ message: "User category removed successfully." })
  } catch (err) {
    console.error("Error deleting user category:", err)
    res.status(500).json({ message: "Failed to delete user category." })
  }
}

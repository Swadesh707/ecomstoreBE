import Category from "../model/Category.js"

export const getAllCategories = async (req, res) => {
  try {
    const allCategory = await Category.find()
    res.json(allCategory)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" })
  }
}

export const createCategory = async (req, res) => {
  try {
    const newCategory = await Category.create(req.body)
    res.json(newCategory)
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!updated) {
      return res.status(404).json({ message: "Category not found" })
    }
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" })
    }
    res.json({ message: "Category deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" })
  }
}

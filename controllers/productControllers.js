import Product from "../model/Product.js"

export const getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query
    let query = {}

    if (category && category !== "All Categories" && category !== "All") {
      query.category = category
    }

    if (search) {
      query.title = { $regex: search, $options: "i" }
    }

    const products = await Product.find(query).sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch products" })
  }
}

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch product" })
  }
}

export const createProduct = async (req, res) => {
  try {
    const { title, price, description, category, image, images, stock } = req.body

    if (!title || price === undefined) {
      return res.status(400).json({ message: "Title and price are required" })
    }

    const productImages = Array.isArray(images) && images.length > 0
      ? images
      : (image ? [image] : [])

    const newProduct = await Product.create({
      title,
      price: Number(price),
      description: description,
      category: category,
      image: image || productImages[0] || "",
      images: productImages,
      stock: stock,
    })

    res.status(201).json(newProduct)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to create product" })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const { title, price, description, category, image, images, stock } = req.body

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (price !== undefined) updateData.price = Number(price)
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (image !== undefined) updateData.image = image
    if (images !== undefined) updateData.images = images
    if (stock !== undefined) updateData.stock = Number(stock)

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updated) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to update product" })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.json({ message: "Product deleted successfully" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to delete product" })
  }
}

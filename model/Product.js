import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: "General",
  },
  image: {
    type: String,
    default: "",
  },
  stock: {
    type: Number,
    default: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Product = mongoose.model("Product", productSchema)

export default Product

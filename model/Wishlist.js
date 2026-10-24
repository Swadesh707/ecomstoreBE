import mongoose from "mongoose"

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      default: "",
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: { type: String, default: "" },
        price: { type: Number, default: 0 },
        category: { type: String, default: "Tailoring" },
        image: { type: String, default: "" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    totalItems: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

const Wishlist = mongoose.model("Wishlist", wishlistSchema)

export default Wishlist

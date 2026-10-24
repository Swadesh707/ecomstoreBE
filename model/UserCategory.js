import mongoose from "mongoose"

const userCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    roleKey: {
      type: String,
      enum: ["admin", "salesperson", "logistics", "user"],
      default: "user",
    },
    permissions: [
      {
        type: String,
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

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

const UserCategory = mongoose.model("UserCategory", userCategorySchema)

export default UserCategory

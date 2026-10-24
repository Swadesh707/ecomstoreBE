import mongoose from "mongoose"
const { Schema } = mongoose

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "salesperson", "logistics", "user"],
      default: "user",
      index: true,
    },
    userCategory: {
      type: String,
      default: "User",
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Suspended", "Pending"],
      default: "Active",
    },
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    zip: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "United States",
    },
    image: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
)

const User = mongoose.model("User", userSchema)

export default User

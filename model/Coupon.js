import mongoose from "mongoose"

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
      default: null, // null means unlimited uses
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    limitPerUser: {
      type: Number,
      default: 1, // default 1 use per account/email
    },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        email: { type: String, default: "" },
        orderNumber: { type: String, default: "" },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

const Coupon = mongoose.model("Coupon", couponSchema)

export default Coupon

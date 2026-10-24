import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["card", "cod"],
      default: "card",
    },
    status: {
      type: String,
      enum: ["Completed", "Pending Collection", "Failed", "Refunded"],
      default: "Completed",
    },
    cardBrand: {
      type: String,
      default: "",
    },
    lastFourDigits: {
      type: String,
      default: "",
    },
    customerName: {
      type: String,
      default: "",
    },
    customerEmail: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
)

const Payment = mongoose.model("Payment", paymentSchema)

export default Payment

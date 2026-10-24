import mongoose from "mongoose"

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    invoiceNumber: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      address: { type: String, required: true },
      city: { type: String, required: true },
      zip: { type: String, required: true },
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          default: null,
        },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        size: { type: String, default: "Standard" },
        image: { type: String, default: "" },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: "",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cod"],
      default: "card",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending Cash on Delivery", "Failed", "Refunded"],
      default: "Paid",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Dispatched", "In Transit", "Delivered", "Cancelled"],
      default: "Processing",
    },
    carrier: {
      type: String,
      default: "Royal Sartorial Express",
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    isReturnRequested: {
      type: Boolean,
      default: false,
    },
    returnStatus: {
      type: String,
      default: "None",
    },
    returnStage: {
      type: String,
      enum: ["none", "processing", "refunded", "completed"],
      default: "none",
    },
    returnReason: {
      type: String,
      default: "",
    },
    cardBrand: {
      type: String,
      default: "",
    },
    lastFourDigits: {
      type: String,
      default: "",
    },
    stockRestored: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Order = mongoose.model("Order", orderSchema)

export default Order

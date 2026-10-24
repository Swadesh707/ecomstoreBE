import mongoose from "mongoose"
import Order from "../model/Order.js"
import Payment from "../model/Payment.js"
import Coupon from "../model/Coupon.js"
import User from "../model/user.js"
import Product from "../model/Product.js"
import Wishlist from "../model/Wishlist.js"

export function validateLuhn(cardNumber) {
  const sanitized = String(cardNumber || "").replace(/\D/g, "")
  if (sanitized.length < 13 || sanitized.length > 19) {
    return false
  }
  let sum = 0
  let alternate = false
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10)
    if (alternate) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    alternate = !alternate
  }
  return sum % 10 === 0
}

export function detectCardBrand(cardNumber) {
  const sanitized = String(cardNumber || "").replace(/\D/g, "")
  if (/^4/.test(sanitized)) return "Visa"
  if (/^(5[1-5]|2[2-7])/.test(sanitized)) return "Mastercard"
  if (/^3[47]/.test(sanitized)) return "American Express"
  if (/^(6011|65|64[4-9])/.test(sanitized)) return "Discover"
  return "Payment Card"
}

export const createOrder = async (req, res) => {
  try {
    const {
      customer,
      items,
      paymentMethod = "card",
      cardNumber,
      expiry,
      cvv,
      couponCode,
      discountAmount = 0,
    } = req.body

    if (!customer || !customer.name || !customer.email || !customer.address || !customer.city || !customer.zip) {
      return res.status(400).json({ message: "Incomplete customer correspondence information." })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items present in order commission." })
    }

    const normalizedPaymentMethod = paymentMethod === "cod" ? "cod" : "card"

    let cardBrand = ""
    let lastFourDigits = ""

    if (normalizedPaymentMethod === "card") {
      if (!cardNumber || !validateLuhn(cardNumber)) {
        return res.status(400).json({
          message: "The credit card number failed mathematical checksum (Luhn algorithm) verification.",
        })
      }

      if (!expiry || !cvv) {
        return res.status(400).json({ message: "Card expiry and security code are required." })
      }

      const digits = String(cardNumber).replace(/\D/g, "")
      lastFourDigits = digits.slice(-4)
      cardBrand = detectCardBrand(digits)
    }

    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    )
    const validDiscount = Math.max(0, Math.min(Number(discountAmount) || 0, subtotal))
    const discountedSubtotal = subtotal - validDiscount
    const shippingFee = discountedSubtotal > 150 ? 0 : discountedSubtotal > 0 ? 15 : 0
    const tax = 0
    const totalAmount = Math.max(0, discountedSubtotal + shippingFee + tax)

    const timestampPart = Date.now().toString().slice(-4)
    const randomOrderPart = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `ORD-${new Date().getFullYear()}-${timestampPart}${randomOrderPart}`
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestampPart}${randomOrderPart}`

    const trackingNumber = req.body.trackingNumber ? String(req.body.trackingNumber).trim() : ""
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // Determine patron User ID link & verify consumer status
    let assignedUserId = null
    let consumerAccountStatus = "Active"
    const candidateUser = req.user?.id || req.body.userId || req.body.user
    if (candidateUser && mongoose.Types.ObjectId.isValid(candidateUser)) {
      assignedUserId = candidateUser
      const foundUser = await User.findById(candidateUser)
      if (foundUser) {
        consumerAccountStatus = foundUser.status || "Active"
        if (foundUser.status === "Suspended") {
          return res.status(403).json({ message: "This patron account is suspended by the atelier director." })
        }
      }
    } else if (customer.email) {
      const existingUser = await User.findOne({ email: customer.email.trim().toLowerCase() })
      if (existingUser) {
        assignedUserId = existingUser._id
        consumerAccountStatus = existingUser.status || "Active"
        if (existingUser.status === "Suspended") {
          return res.status(403).json({ message: "This patron account is suspended by the atelier director." })
        }
      }
    }

    // Process Line Items
    const processedItems = []
    for (const item of items) {
      let validProductId = null
      const candidateId = item.productId || item._id || item.id
      if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
        validProductId = candidateId
      } else if (item.title || item.name) {
        const foundProd = await Product.findOne({ title: item.title || item.name })
        if (foundProd) validProductId = foundProd._id
      }
      const itemPrice = Number(item.price) || 0
      const itemQuantity = Math.max(1, Number(item.quantity) || 1)
      processedItems.push({
        productId: validProductId,
        title: item.title || item.name || "Tailored Piece",
        price: itemPrice,
        quantity: itemQuantity,
        size: item.size || "Standard",
        color: item.color || "Default",
        image: item.image || "",
        lineTotal: itemPrice * itemQuantity,
      })
    }

    // Create clean, flat Order in MongoDB
    const newOrder = await Order.create({
      orderNumber,
      trackingNumber,
      invoiceNumber,
      soldBy: req.body.soldBy || (req.user?.name || ""),
      user: assignedUserId,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone ? customer.phone.trim() : "",
        address: customer.address.trim(),
        city: customer.city.trim(),
        zip: customer.zip.trim(),
      },
      items: processedItems,
      subtotal,
      shippingFee,
      discountAmount: validDiscount,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : "",
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: normalizedPaymentMethod === "cod" ? "Pending Cash on Delivery" : "Paid",
      orderStatus: "Processing",
      carrier: "Royal Sartorial Express",
      estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      isReturnRequested: false,
      returnStatus: "None",
      returnStage: "none",
      returnReason: "",
      cardBrand,
      lastFourDigits,
    })

    // Create clean, flat Payment Document in MongoDB
    try {
      await Payment.create({
        transactionId,
        orderId: newOrder._id,
        orderNumber,
        userId: assignedUserId,
        amount: totalAmount,
        method: normalizedPaymentMethod,
        status: normalizedPaymentMethod === "cod" ? "Pending Collection" : "Completed",
        cardBrand,
        lastFourDigits,
        customerName: customer.name.trim(),
        customerEmail: customer.email.trim(),
      })
    } catch (payErr) {
      console.error("Payment document recording notice:", payErr)
    }

    // Decrement stock accurately for products in database
    for (const item of processedItems) {
      try {
        if (item.productId) {
          const prod = await Product.findById(item.productId)
          if (prod) {
            const currentStock = typeof prod.stock === "number" ? prod.stock : 10
            prod.stock = Math.max(0, currentStock - item.quantity)
            await prod.save()
          }
        } else if (item.title) {
          const prod = await Product.findOne({ title: item.title })
          if (prod) {
            const currentStock = typeof prod.stock === "number" ? prod.stock : 10
            prod.stock = Math.max(0, currentStock - item.quantity)
            await prod.save()
          }
        }
      } catch (stockErr) {
        console.error("Stock decrement error:", stockErr)
      }
    }

    // If coupon was applied, record usage
    if (couponCode) {
      try {
        await Coupon.findOneAndUpdate(
          { code: couponCode.trim().toUpperCase() },
          {
            $inc: { usedCount: 1 },
            $push: {
              usedBy: {
                userId: assignedUserId,
                email: customer.email.trim(),
                orderNumber,
                usedAt: new Date(),
              },
            },
          }
        )
      } catch (err) {
        console.error("Error recording coupon usage:", err)
      }
    }

    return res.status(201).json(newOrder)
  } catch (err) {
    console.error("Order creation error:", err)
    return res.status(500).json({
      message: err.message || "Failed to record commission order.",
      error: err.toString(),
    })
  }
}

export const createInStoreBill = async (req, res) => {
  try {
    const {
      soldBy,
      customerName,
      customerEmail,
      items,
      productId,
      itemTitle,
      unitPrice,
      quantity = 1,
      paymentMethod = "card",
      discountPercentage = 0,
      discountAmount = 0,
    } = req.body

    const activeSoldBy = soldBy || req.user?.name || "Salesperson"
    const custName = customerName?.trim() || "In-Store Client"
    const custEmail = customerEmail?.trim() || "client@instore.ecomstore.com"

    let processedItems = []
    let subtotal = 0

    if (Array.isArray(items) && items.length > 0) {
      processedItems = items.map((it) => ({
        productId: it.productId || null,
        title: it.title || "Tailored Item",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        size: it.size || "Standard",
        color: it.color || "Classic",
        image: it.image || "",
      }))
      subtotal = processedItems.reduce((acc, it) => acc + it.price * it.quantity, 0)
    } else {
      const price = Number(unitPrice) || 0
      const qty = Number(quantity) || 1
      subtotal = price * qty

      let itemImage = ""
      if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        const prod = await Product.findById(productId)
        if (prod) {
          itemImage = prod.image || (prod.images && prod.images[0]) || ""
        }
      }

      processedItems.push({
        productId: (productId && mongoose.Types.ObjectId.isValid(productId)) ? productId : null,
        title: itemTitle || "Tailored Item",
        price,
        quantity: qty,
        size: "Standard",
        color: "Classic",
        image: itemImage,
      })
    }

    const discountPercent = Math.max(0, Math.min(100, Number(discountPercentage) || 0))
    const calculatedDiscount = discountPercent > 0
      ? (subtotal * discountPercent) / 100
      : Number(discountAmount) || 0
    const totalAmount = Math.max(0, subtotal - calculatedDiscount)

    const timestampPart = Date.now().toString().slice(-4)
    const randomPart = Math.floor(1000 + Math.random() * 9000)
    const orderNumber = `BILL-${new Date().getFullYear()}-${timestampPart}${randomPart}`
    const invoiceNumber = `INV-${new Date().getFullYear()}-${timestampPart}${randomPart}`

    const newBill = await Order.create({
      orderNumber,
      invoiceNumber,
      trackingNumber: "",
      soldBy: activeSoldBy,
      customer: {
        name: custName,
        email: custEmail,
        phone: "",
        address: "In-Store Purchase",
        city: "Atelier Boutique",
        zip: "10001",
      },
      items: processedItems,
      subtotal,
      discountAmount: calculatedDiscount,
      shippingFee: 0,
      totalAmount,
      paymentMethod: paymentMethod === "cod" ? "cod" : "card",
      paymentStatus: "Paid",
      orderStatus: "Delivered",
      carrier: "In-Store Handover",
      estimatedDeliveryDate: new Date(),
    })

    // Decrement stock for inventory items sold
    for (const item of processedItems) {
      try {
        let prod = null
        if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
          prod = await Product.findById(item.productId)
        }
        if (!prod && item.title) {
          prod = await Product.findOne({ title: item.title })
        }
        if (prod) {
          const currentStock = typeof prod.stock === "number" ? prod.stock : 10
          prod.stock = Math.max(0, currentStock - item.quantity)
          await prod.save()
        }
      } catch (stockErr) {
        console.error("Stock deduction error for in-store bill:", stockErr)
      }
    }

    return res.status(201).json(newBill)
  } catch (err) {
    console.error("In-store bill generation error:", err)
    return res.status(500).json({
      message: "Failed to record in-store bill in database.",
      error: err.toString(),
    })
  }
}

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { orderStatus, trackingNumber, carrier, estimatedDeliveryDate } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (orderStatus) order.orderStatus = orderStatus
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber
    if (carrier) order.carrier = carrier
    if (estimatedDeliveryDate) order.estimatedDeliveryDate = estimatedDeliveryDate

    // If order is cancelled, return items back to stock
    if (orderStatus === "Cancelled" && !order.stockRestored) {
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
        }
      }
      order.stockRestored = true
    }

    await order.save()
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Failed to update order" })
  }
}

export const cancelUserOrder = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" })
    }

    order.orderStatus = "Cancelled"
    order.paymentStatus = "Refunded"

    if (!order.stockRestored) {
      for (const item of order.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
        }
      }
      order.stockRestored = true
    }

    await order.save()
    res.json({ message: "Order cancelled successfully", order })
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel order" })
  }
}

export const requestOrderReturn = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    order.isReturnRequested = true
    order.returnStatus = "Return Requested"
    order.returnReason = reason || "Return Requested"

    await order.save()
    res.json({ message: "Return requested successfully", order })
  } catch (err) {
    res.status(500).json({ message: "Failed to request return" })
  }
}

export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { returnStatus } = req.body

    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    order.returnStatus = returnStatus || order.returnStatus

    // If return is approved or completed, refund payment and restore stock
    if (returnStatus === "Approved" || returnStatus === "Refunded" || returnStatus === "Completed") {
      order.paymentStatus = "Refunded"
      if (!order.stockRestored) {
        for (const item of order.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
          }
        }
        order.stockRestored = true
      }
    }

    await order.save()
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Failed to update return status" })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Error retrieving order" })
  }
}

export const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Error retrieving order" })
  }
}

export const getOrderByTracking = async (req, res) => {
  try {
    const order = await Order.findOne({ trackingNumber: req.params.trackingNumber })
    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: "Error tracking order" })
  }
}

export const getUserOrders = async (req, res) => {
  try {
    const email = req.user?.email || ""
    const userId = req.user?.id
    const orders = await Order.find({
      $or: [{ user: userId }, { "customer.email": email }],
    }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user orders" })
  }
}

export const getAnalyticsSummary = async (req, res) => {
  try {
    const orders = await Order.find()

    let totalRevenue = 0
    let totalShippingCollected = 0
    let totalDiscountGiven = 0
    const activeOrdersCount = orders.filter((o) => o.orderStatus !== "Cancelled").length

    const productSalesMap = {}
    const categorySalesMap = {}
    const monthlySalesMap = {}

    for (const order of orders) {
      if (order.orderStatus === "Cancelled") continue

      totalRevenue += order.totalAmount || 0
      totalShippingCollected += order.shippingFee || 0
      totalDiscountGiven += order.discountAmount || 0

      // Monthly / Date grouping
      const dateKey = new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      if (!monthlySalesMap[dateKey]) {
        monthlySalesMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 }
      }
      monthlySalesMap[dateKey].revenue += order.totalAmount || 0
      monthlySalesMap[dateKey].orders += 1

      // Item metrics
      for (const item of order.items || []) {
        const title = item.title || "Unknown Article"
        if (!productSalesMap[title]) {
          productSalesMap[title] = {
            title,
            image: item.image,
            quantity: 0,
            revenue: 0,
          }
        }
        productSalesMap[title].quantity += item.quantity || 1
        productSalesMap[title].revenue += (item.price || 0) * (item.quantity || 1)
      }
    }

    // Estimate Logistics Costs:
    const courierOperatingCostPerOrder = 14.5
    const totalLogisticsCost = orders.length * courierOperatingCostPerOrder

    // Estimate Product Costs (COGS):
    const totalProductCost = Math.round(totalRevenue * 0.42 * 100) / 100

    // Profit Calculations
    const grossProfit = Math.round((totalRevenue - totalProductCost) * 100) / 100
    const netProfit = Math.round((grossProfit - totalLogisticsCost) * 100) / 100
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0

    // Trending Products
    const trendingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Wishlist Demand Aggregation
    const allWishlists = await Wishlist.find().populate("items.productId")
    const wishlistDemandMap = {}

    for (const w of allWishlists) {
      for (const item of w.items || []) {
        const prod = item.productId
        const pid = prod?._id ? prod._id.toString() : item.productId ? item.productId.toString() : null
        if (!pid) continue

        if (!wishlistDemandMap[pid]) {
          wishlistDemandMap[pid] = {
            id: pid,
            title: prod?.title || item.title || "Archived Item",
            category: prod?.category || item.category || "General",
            price: prod?.price ?? item.price ?? 0,
            image: prod?.image || item.image || "",
            wishlistCount: 0,
          }
        }
        wishlistDemandMap[pid].wishlistCount += 1
      }
    }

    const trendingWishlist = Object.values(wishlistDemandMap)
      .sort((a, b) => b.wishlistCount - a.wishlistCount)
      .slice(0, 5)

    // Category Sales Distribution
    const productsInDb = await Product.find({}, "title category")
    const productCatMap = {}
    for (const p of productsInDb) {
      productCatMap[p.title] = p.category || "Tailoring & Outerwear"
    }

    for (const pName of Object.keys(productSalesMap)) {
      const cat = productCatMap[pName] || "Tailoring & Outerwear"
      if (!categorySalesMap[cat]) {
        categorySalesMap[cat] = 0
      }
      categorySalesMap[cat] += productSalesMap[pName].revenue
    }

    const categoryBreakdown = Object.entries(categorySalesMap).map(([category, revenue]) => ({
      category,
      revenue: Math.round(revenue * 100) / 100,
      share: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
    }))

    // Format monthly trend array (last 7 data points)
    const monthlyTrend = Object.values(monthlySalesMap).slice(-7)
    if (monthlyTrend.length === 0) {
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
      monthlyTrend.push({ date: today, revenue: totalRevenue, orders: orders.length })
    }

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      grossProfit,
      netProfit,
      profitMargin,
      totalLogisticsCost: Math.round(totalLogisticsCost * 100) / 100,
      totalProductCost,
      totalOrders: orders.length,
      activeOrdersCount,
      totalShippingCollected: Math.round(totalShippingCollected * 100) / 100,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      trendingProducts,
      trendingWishlist,
      categoryBreakdown,
      monthlyTrend,
    })
  } catch (err) {
    console.error("Error generating analytics:", err)
    res.status(500).json({ message: "Failed to generate analytics data." })
  }
}

export const updateInStoreBill = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Bill not found" })
    }

    const {
      customerName,
      customerEmail,
      items,
      productId,
      itemTitle,
      unitPrice,
      quantity = 1,
      paymentMethod,
      discountPercentage = 0,
      discountAmount = 0,
    } = req.body

    // 1. Restore previous stock for items in this bill
    for (const oldItem of order.items) {
      try {
        let prod = null
        if (oldItem.productId && mongoose.Types.ObjectId.isValid(oldItem.productId)) {
          prod = await Product.findById(oldItem.productId)
        }
        if (!prod && oldItem.title) {
          prod = await Product.findOne({ title: oldItem.title })
        }
        if (prod) {
          prod.stock = (Number(prod.stock) || 0) + (Number(oldItem.quantity) || 1)
          await prod.save()
        }
      } catch (err) {
        console.error("Error restoring old stock on bill edit:", err)
      }
    }

    // 2. Prepare new processed items
    let processedItems = []
    let subtotal = 0

    if (Array.isArray(items) && items.length > 0) {
      processedItems = items.map((it) => ({
        productId: it.productId || null,
        title: it.title || "Tailored Item",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        size: it.size || "Standard",
        color: it.color || "Classic",
        image: it.image || "",
      }))
      subtotal = processedItems.reduce((acc, it) => acc + it.price * it.quantity, 0)
    } else {
      const price = Number(unitPrice) || 0
      const qty = Number(quantity) || 1
      subtotal = price * qty

      let itemImage = ""
      if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        const prod = await Product.findById(productId)
        if (prod) {
          itemImage = prod.image || (prod.images && prod.images[0]) || ""
        }
      }

      processedItems.push({
        productId: (productId && mongoose.Types.ObjectId.isValid(productId)) ? productId : null,
        title: itemTitle || "Tailored Item",
        price,
        quantity: qty,
        size: "Standard",
        color: "Classic",
        image: itemImage,
      })
    }

    const discountPercent = Math.max(0, Math.min(100, Number(discountPercentage) || 0))
    const calculatedDiscount = discountPercent > 0
      ? (subtotal * discountPercent) / 100
      : Number(discountAmount) || 0
    const totalAmount = Math.max(0, subtotal - calculatedDiscount)

    // 3. Decrement new stock
    for (const newItem of processedItems) {
      try {
        let prod = null
        if (newItem.productId && mongoose.Types.ObjectId.isValid(newItem.productId)) {
          prod = await Product.findById(newItem.productId)
        }
        if (!prod && newItem.title) {
          prod = await Product.findOne({ title: newItem.title })
        }
        if (prod) {
          const curStock = typeof prod.stock === "number" ? prod.stock : 10
          prod.stock = Math.max(0, curStock - newItem.quantity)
          await prod.save()
        }
      } catch (stockErr) {
        console.error("Error decrementing new stock on bill edit:", stockErr)
      }
    }

    // 4. Update order fields
    if (customerName) order.customer.name = customerName.trim()
    if (customerEmail) order.customer.email = customerEmail.trim()
    order.items = processedItems
    order.subtotal = subtotal
    order.discountAmount = calculatedDiscount
    order.totalAmount = totalAmount
    if (paymentMethod) order.paymentMethod = paymentMethod === "cod" ? "cod" : "card"

    await order.save()
    return res.json(order)
  } catch (err) {
    console.error("Error updating bill:", err)
    return res.status(500).json({ message: "Failed to update bill." })
  }
}

export const deleteInStoreBill = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ message: "Bill not found" })
    }

    // Restore stock for all items
    for (const item of order.items) {
      try {
        let prod = null
        if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
          prod = await Product.findById(item.productId)
        }
        if (!prod && item.title) {
          prod = await Product.findOne({ title: item.title })
        }
        if (prod) {
          prod.stock = (Number(prod.stock) || 0) + (Number(item.quantity) || 1)
          await prod.save()
        }
      } catch (stockErr) {
        console.error("Stock restore error on bill delete:", stockErr)
      }
    }

    await Order.findByIdAndDelete(id)
    return res.json({ success: true, message: "Bill deleted and stock restored successfully." })
  } catch (err) {
    console.error("Error deleting bill:", err)
    return res.status(500).json({ message: "Failed to delete bill." })
  }
}

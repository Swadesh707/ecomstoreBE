import Payment from "../model/Payment.js"

export const getAllPayments = async (req, res) => {
  try {
    const { status, method } = req.query
    const query = {}

    if (status && status !== "All") {
      query.status = status
    }
    if (method && method !== "All") {
      query.method = method
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 })
    res.json(payments)
  } catch (err) {
    console.error("Error retrieving payments:", err)
    res.status(500).json({ message: "Failed to retrieve payment records." })
  }
}

export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
    if (!payment) {
      return res.status(404).json({ message: "Payment transaction record not found." })
    }
    res.json(payment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error retrieving payment record." })
  }
}

export const getPaymentByOrderNumber = async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderNumber: req.params.orderNumber })
    if (!payment) {
      return res.status(404).json({ message: "Payment record for this order was not found." })
    }
    res.json(payment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Error finding payment record." })
  }
}

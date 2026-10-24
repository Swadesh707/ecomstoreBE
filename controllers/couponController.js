import Coupon from "../model/Coupon.js"

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json(coupons)
  } catch (err) {
    console.error("Error retrieving coupons:", err)
    res.status(500).json({ message: "Failed to fetch coupons." })
  }
}

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxUses,
      limitPerUser,
      expiryDate,
      isActive,
    } = req.body

    if (!code || discountValue === undefined) {
      return res.status(400).json({ message: "Coupon code and discount value are required." })
    }

    const cleanCode = code.trim().toUpperCase()
    const existing = await Coupon.findOne({ code: cleanCode })
    if (existing) {
      return res.status(400).json({ message: `Coupon with code "${cleanCode}" already exists.` })
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description || "",
      discountType: discountType === "fixed" ? "fixed" : "percentage",
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxUses: maxUses !== undefined && maxUses !== "" && maxUses !== null ? Number(maxUses) : null,
      limitPerUser:
        limitPerUser !== undefined && limitPerUser !== "" && limitPerUser !== null
          ? Number(limitPerUser)
          : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    })

    res.status(201).json(coupon)
  } catch (err) {
    console.error("Error creating coupon:", err)
    res.status(500).json({ message: "Failed to create discount coupon." })
  }
}

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body }

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase()
    }
    if (updateData.discountValue !== undefined) {
      updateData.discountValue = Number(updateData.discountValue)
    }
    if (updateData.minOrderAmount !== undefined) {
      updateData.minOrderAmount = Number(updateData.minOrderAmount)
    }
    if (updateData.maxUses !== undefined) {
      updateData.maxUses =
        updateData.maxUses !== "" && updateData.maxUses !== null ? Number(updateData.maxUses) : null
    }
    if (updateData.limitPerUser !== undefined) {
      updateData.limitPerUser =
        updateData.limitPerUser !== "" && updateData.limitPerUser !== null
          ? Number(updateData.limitPerUser)
          : null
    }
    if (updateData.expiryDate !== undefined) {
      updateData.expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : null
    }

    const updated = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!updated) {
      return res.status(404).json({ message: "Coupon not found." })
    }

    res.json(updated)
  } catch (err) {
    console.error("Error updating coupon:", err)
    res.status(500).json({ message: "Failed to update discount coupon." })
  }
}

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Coupon.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ message: "Coupon not found." })
    }
    res.json({ message: "Coupon removed successfully." })
  } catch (err) {
    console.error("Error deleting coupon:", err)
    res.status(500).json({ message: "Failed to delete discount coupon." })
  }
}

export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, email, userId } = req.body

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required." })
    }

    const cleanCode = code.trim().toUpperCase()
    const coupon = await Coupon.findOne({ code: cleanCode })

    if (!coupon) {
      return res.status(404).json({ message: "Coupon code does not exist." })
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "This coupon is currently inactive." })
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: "This coupon has expired." })
    }

    const numericSubtotal = Number(subtotal) || 0
    if (coupon.minOrderAmount && numericSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Order subtotal must be at least $${coupon.minOrderAmount.toFixed(
          2
        )} to apply this coupon.`,
      })
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        message: `This coupon has reached its maximum global usage limit (${coupon.maxUses} uses).`,
      })
    }

    if (coupon.limitPerUser !== null) {
      const userMatches = coupon.usedBy.filter((entry) => {
        if (userId && entry.userId && entry.userId.toString() === userId.toString()) {
          return true
        }
        if (email && entry.email && entry.email.toLowerCase() === email.toLowerCase()) {
          return true
        }
        return false
      })

      if (userMatches.length >= coupon.limitPerUser) {
        return res.status(400).json({
          message: `You have already redeemed this coupon the maximum allowed times (${coupon.limitPerUser} use per patron).`,
        })
      }
    }

    let discountAmount = 0
    if (coupon.discountType === "percentage") {
      discountAmount = (numericSubtotal * coupon.discountValue) / 100
    } else {
      discountAmount = Math.min(coupon.discountValue, numericSubtotal)
    }
    discountAmount = Math.round(discountAmount * 100) / 100

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      description: coupon.description,
    })
  } catch (err) {
    console.error("Error validating coupon:", err)
    res.status(500).json({ message: "Failed to validate coupon." })
  }
}

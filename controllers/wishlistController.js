import Wishlist from "../model/Wishlist.js"
import User from "../model/user.js"
import Product from "../model/Product.js"

export const getWishlistByUserId = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user?.id
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required." })
    }

    const wishlistDoc = await Wishlist.findOne({ userId: targetUserId }).populate("items.productId")
    res.json(wishlistDoc ? wishlistDoc.items : [])
  } catch (err) {
    console.error("Error retrieving user wishlist:", err)
    res.status(500).json({ message: "Failed to retrieve wishlist from database." })
  }
}

export const getAllWishlists = async (req, res) => {
  try {
    const wishlists = await Wishlist.find()
      .populate("userId", "fullName email role status")
      .populate("items.productId")
      .sort({ updatedAt: -1 })
    res.json(wishlists)
  } catch (err) {
    console.error("Error fetching all wishlists:", err)
    res.status(500).json({ message: "Failed to retrieve archive wishlists." })
  }
}

export const syncWishlistBucket = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId
    if (!userId) {
      return res.status(400).json({ message: "Authentication required to sync wishlist." })
    }

    const { items = [] } = req.body
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    const formattedItems = items.map((item) => ({
      productId: item._id || item.productId,
      title: item.title || item.name || "",
      price: Number(item.price) || 0,
      category: item.category || "Tailoring",
      image: item.image || "",
      addedAt: item.addedAt || new Date(),
    }))

    const updated = await Wishlist.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        userEmail: user.email,
        items: formattedItems,
        totalItems: formattedItems.length,
      },
      { upsert: true, new: true }
    )

    res.json({ message: "Wishlist synchronized.", wishlist: updated })
  } catch (err) {
    console.error("Error syncing wishlist:", err)
    res.status(500).json({ message: "Failed to sync wishlist." })
  }
}

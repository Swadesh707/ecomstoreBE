import CollectedMails from "../model/CollectedMails.js"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const subscribeMail = async (req, res) => {
  try {
    const rawEmail = req.body?.email || ""
    const email = String(rawEmail).trim().toLowerCase()

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      })
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      })
    }

    const existing = await CollectedMails.findOne({ email })
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed with this email.",
        data: { email: existing.email },
      })
    }

    const newMail = await CollectedMails.create({ email })

    return res.status(201).json({
      success: true,
      message: "Thank you for subscribing to updates!",
      data: { email: newMail.email },
      id: newMail._id,
    })
  } catch (err) {

    if (err.code === 11000) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed with this email.",
      })
    }
    console.error("Error subscribing email:", err)
    return res.status(500).json({
      success: false,
      message: "Server error occurred while saving your email.",
    })
  }
}

export const getAllCollectedMails = async (req, res) => {
  try {
    const mails = await CollectedMails.find({}).sort({ createdAt: -1 }).lean()

    const formatted = mails.map((m) => ({
      _id: m._id,
      email: m.email,
      createdAt: m.createdAt,
    }))

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    })
  } catch (err) {
    console.error("Error fetching collected mails:", err)
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve collected emails.",
    })
  }
}

export const deleteCollectedMail = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await CollectedMails.findByIdAndDelete(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Email record not found.",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Email removed successfully.",
      data: { email: deleted.email },
    })
  } catch (err) {
    console.error("Error deleting collected mail:", err)
    return res.status(500).json({
      success: false,
      message: "Failed to delete email record.",
    })
  }
}

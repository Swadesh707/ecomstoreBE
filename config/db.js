import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config({ quiet: true })

export const connectDB = async () => {
  try {
    let mongoUrl =
      process.env.MONGO_URL ||
      process.env.DB_URL ||
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/ecomstore"

    if (mongoUrl.includes(".mongodb.net/") && !mongoUrl.includes(".mongodb.net/ecomstore")) {
      mongoUrl = mongoUrl.replace(".mongodb.net/", ".mongodb.net/ecomstore?retryWrites=true&w=majority")
    }

    const response = await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000,
    })
    return response
  } catch (err) {
    try {
      const fallback = await mongoose.connect("mongodb://127.0.0.1:27017/ecomstore", {
        serverSelectionTimeoutMS: 3000,
      })
      return fallback
    } catch {
      // Retain buffer
    }
  }
}

export default connectDB

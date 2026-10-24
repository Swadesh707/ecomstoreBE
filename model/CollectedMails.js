import mongoose from "mongoose"

const collectedMailsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

const CollectedMails = mongoose.model("CollectedMails", collectedMailsSchema)

export default CollectedMails

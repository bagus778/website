import mongoose from 'mongoose'

const PageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metaTitle: String,
    metaDescription: String,
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Page || mongoose.model('Page', PageSchema)

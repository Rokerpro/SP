import { Schema, model } from 'mongoose'

export interface ProgressDocument {
  userId: string
  lessonSlug: string
  completed: boolean
  viewedAt: Date
}

const progressSchema = new Schema<ProgressDocument>(
  {
    userId: { type: String, required: true, index: true },
    lessonSlug: { type: String, required: true },
    completed: { type: Boolean, default: false },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

progressSchema.index({ userId: 1, lessonSlug: 1 }, { unique: true })

export const Progress = model<ProgressDocument>('Progress', progressSchema)
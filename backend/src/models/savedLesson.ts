import { Schema, model } from 'mongoose'

export interface SavedLessonDocument {
  userId: string
  lessonSlug: string
}

const savedLessonSchema = new Schema<SavedLessonDocument>(
  {
    userId: { type: String, required: true, index: true },
    lessonSlug: { type: String, required: true },
  },
  { timestamps: true },
)

savedLessonSchema.index({ userId: 1, lessonSlug: 1 }, { unique: true })

export const SavedLesson = model<SavedLessonDocument>('SavedLesson', savedLessonSchema)
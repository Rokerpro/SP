import { Schema, model } from 'mongoose'

export interface QuizAttemptDocument {
  userId: string
  lessonSlug: string
  answer: number
  correct: boolean
}

const quizAttemptSchema = new Schema<QuizAttemptDocument>(
  {
    userId: { type: String, required: true, index: true },
    lessonSlug: { type: String, required: true },
    answer: { type: Number, required: true },
    correct: { type: Boolean, required: true },
  },
  { timestamps: true },
)

export const QuizAttempt = model<QuizAttemptDocument>('QuizAttempt', quizAttemptSchema)
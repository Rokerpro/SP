import { Schema, model } from 'mongoose'

export interface QuizDocument {
  lessonSlug: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

const quizSchema = new Schema<QuizDocument>(
  {
    lessonSlug: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { timestamps: true },
)

export const Quiz = model<QuizDocument>('Quiz', quizSchema)
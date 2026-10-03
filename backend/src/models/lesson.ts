import { Schema, model } from 'mongoose'

export type LessonCategory =
  | 'Science'
  | 'Space'
  | 'Technology'
  | 'Mathematics'
  | 'Psychology'
  | 'History'
  | 'Environment'
  | 'Literature'
  | 'Economics'

export type LessonDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface LessonDocument {
  slug: string
  category: LessonCategory
  title: string
  topic: string
  explanation: string
  takeaway: string
  difficulty: LessonDifficulty
  visualKey: string
  relatedTopics: string[]
  minAge?: number
  maxAge?: number
  gradeLevel?: string
}

const lessonSchema = new Schema<LessonDocument>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    takeaway: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, trim: true },
    visualKey: { type: String, required: true, trim: true },
    relatedTopics: { type: [String], required: true },
    minAge: { type: Number, default: 6 },
    maxAge: { type: Number, default: 99 },
    gradeLevel: { type: String, default: 'All' },
  },
  { timestamps: true },
)

export const Lesson = model<LessonDocument>('Lesson', lessonSchema)
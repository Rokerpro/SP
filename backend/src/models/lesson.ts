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

export interface LessonQuestion {
  id: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

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
  mediaType?: 'text' | 'video'
  videoUrl?: string
  authorId?: string
  authorName?: string
  status?: 'approved' | 'pending' | 'rejected'
  questions?: LessonQuestion[]
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
    mediaType: { type: String, enum: ['text', 'video'], default: 'text' },
    videoUrl: { type: String, default: '' },
    authorId: { type: String, default: '' },
    authorName: { type: String, default: '' },
    status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved' },
    questions: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
)

export const Lesson = model<LessonDocument>('Lesson', lessonSchema)
import { Schema, model } from 'mongoose'

export interface UserDocument {
  email: string
  username: string
  displayName: string
  passwordHash: string
  interests: string[]
  age: number
  grade: string
  xp: number
  streak: number
  completedCount: number
  role: 'user' | 'admin'
  bio: string
  avatar: string
  followers: string[]
  following: string[]
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    interests: { type: [String], default: [] },
    age: { type: Number, required: true, min: 5, max: 120 },
    grade: { type: String, default: 'General' },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    followers: { type: [String], default: [] },
    following: { type: [String], default: [] },
  },
  { timestamps: true },
)

export const User = model<UserDocument>('User', userSchema)
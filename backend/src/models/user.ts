import { Schema, model } from 'mongoose'

export interface UserDocument {
  email: string
  username: string
  displayName: string
  passwordHash: string
  interests: string[]
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    interests: { type: [String], default: [] },
  },
  { timestamps: true },
)

export const User = model<UserDocument>('User', userSchema)
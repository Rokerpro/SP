import mongoose from 'mongoose'

const mongoUri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/bolt'

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(mongoUri)
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}
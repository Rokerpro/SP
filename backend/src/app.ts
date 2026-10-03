import cors from 'cors'
import express from 'express'
import { Lesson } from './models/lesson.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ success: true, data: { service: 'bolt-api', status: 'ok' } })
})

app.get('/api/lessons', async (_request, response) => {
  const lessons = await Lesson.find().sort({ createdAt: 1 }).lean()
  response.json({ success: true, data: lessons })
})

app.get('/api/lessons/:slug', async (request, response) => {
  const lesson = await Lesson.findOne({ slug: request.params.slug }).lean()

  if (!lesson) {
    response.status(404).json({ success: false, error: 'Lesson not found' })
    return
  }

  response.json({ success: true, data: lesson })
})
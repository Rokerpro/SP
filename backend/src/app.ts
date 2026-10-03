import cors from 'cors'
import express from 'express'
import { comparePassword, createToken, hashPassword, requireAuth, type AuthenticatedRequest } from './auth.js'
import { Lesson } from './models/lesson.js'
import { User } from './models/user.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.post('/api/auth/signup', async (request, response) => {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''

  if (!email || password.length < 8) {
    response.status(400).json({ success: false, error: 'Use a valid email and an 8 character password' })
    return
  }

  const existingUser = await User.findOne({ email })
  if (existingUser) {
    response.status(409).json({ success: false, error: 'An account already exists for this email' })
    return
  }

  const user = await User.create({ email, passwordHash: await hashPassword(password) })
  response.status(201).json({ success: true, data: { token: createToken(user.id), user: { id: user.id, email: user.email, interests: user.interests } } })
})

app.post('/api/auth/login', async (request, response) => {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  const user = await User.findOne({ email })

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    response.status(401).json({ success: false, error: 'Email or password is incorrect' })
    return
  }

  response.json({ success: true, data: { token: createToken(user.id), user: { id: user.id, email: user.email, interests: user.interests } } })
})

app.get('/api/auth/me', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()

  if (!user) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  response.json({ success: true, data: { id: user._id, email: user.email, interests: user.interests } })
})

app.put('/api/auth/interests', requireAuth, async (request: AuthenticatedRequest, response) => {
  const interests = Array.isArray(request.body.interests) ? request.body.interests.filter((interest: unknown): interest is string => typeof interest === 'string') : []

  if (interests.length < 3) {
    response.status(400).json({ success: false, error: 'Select at least 3 interests' })
    return
  }

  const user = await User.findByIdAndUpdate(request.userId, { interests }, { new: true }).lean()
  if (!user) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  response.json({ success: true, data: { email: user.email, interests: user.interests } })
})

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
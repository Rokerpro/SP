import cors from 'cors'
import express from 'express'
import { comparePassword, createToken, hashPassword, requireAuth, type AuthenticatedRequest } from './auth.js'
import { Lesson } from './models/lesson.js'
import { Progress } from './models/progress.js'
import { Quiz } from './models/quiz.js'
import { QuizAttempt } from './models/quizAttempt.js'
import { SavedLesson } from './models/savedLesson.js'
import { User } from './models/user.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.post('/api/auth/signup', async (request, response) => {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const username = typeof request.body.username === 'string' ? request.body.username.trim().toLowerCase() : ''
  const displayName = typeof request.body.displayName === 'string' ? request.body.displayName.trim() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  const confirmPassword = typeof request.body.confirmPassword === 'string' ? request.body.confirmPassword : ''

  if (!email || !username || !displayName || password.length < 8 || password !== confirmPassword) {
    response.status(400).json({ success: false, error: 'Complete all fields and make sure both passwords match' })
    return
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] })
  if (existingUser) {
    response.status(409).json({ success: false, error: 'That email or username is already in use' })
    return
  }

  const user = await User.create({ email, username, displayName, passwordHash: await hashPassword(password) })
  response.status(201).json({ success: true, data: { token: createToken(user.id), user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, interests: user.interests } } })
})

app.post('/api/auth/login', async (request, response) => {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  const user = await User.findOne({ email })

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    response.status(401).json({ success: false, error: 'Email or password is incorrect' })
    return
  }

  response.json({ success: true, data: { token: createToken(user.id), user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, interests: user.interests } } })
})

app.get('/api/auth/me', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()

  if (!user) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  response.json({ success: true, data: { id: user._id, email: user.email, username: user.username, displayName: user.displayName, interests: user.interests } })
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

app.get('/api/lessons/search', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''
  const filter = query ? { $or: [{ title: new RegExp(query, 'i') }, { topic: new RegExp(query, 'i') }, { category: new RegExp(query, 'i') }] } : {}
  const lessons = await Lesson.find(filter).sort({ createdAt: 1 }).lean()
  response.json({ success: true, data: lessons })
})

app.get('/api/categories', async (_request, response) => {
  response.json({ success: true, data: await Lesson.distinct('category') })
})

app.get('/api/feed', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  const lessons = await Lesson.find().lean()
  const interests = user?.interests ?? []
  lessons.sort((left, right) => Number(interests.includes(right.category)) - Number(interests.includes(left.category)))
  response.json({ success: true, data: lessons })
})

app.post('/api/progress/:lessonSlug', requireAuth, async (request: AuthenticatedRequest, response) => {
  const progress = await Progress.findOneAndUpdate(
    { userId: request.userId, lessonSlug: request.params.lessonSlug },
    { userId: request.userId, lessonSlug: request.params.lessonSlug, completed: Boolean(request.body.completed), viewedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean()
  response.json({ success: true, data: progress })
})

app.get('/api/progress', requireAuth, async (request: AuthenticatedRequest, response) => {
  const [progress, attempts, savedLessons, lessons] = await Promise.all([
    Progress.find({ userId: request.userId }).sort({ updatedAt: -1 }).lean(),
    QuizAttempt.find({ userId: request.userId }).sort({ createdAt: -1 }).lean(),
    SavedLesson.countDocuments({ userId: request.userId }),
    Lesson.find().select('slug category').lean(),
  ])
  const completed = progress.filter((item) => item.completed).length
  const correct = attempts.filter((item) => item.correct).length
  const categoryProgress = lessons.reduce<Record<string, { completed: number; total: number }>>((summary, lesson) => {
    summary[lesson.category] ??= { completed: 0, total: 0 }
    summary[lesson.category].total += 1
    if (progress.some((item) => item.lessonSlug === lesson.slug && item.completed)) summary[lesson.category].completed += 1
    return summary
  }, {})
  const activeDates = new Set(progress.filter((item) => item.completed).map((item) => new Date(item.viewedAt).toISOString().slice(0, 10)))
  let streak = 0
  const day = new Date()
  while (activeDates.has(day.toISOString().slice(0, 10))) {
    streak += 1
    day.setDate(day.getDate() - 1)
  }
  response.json({ success: true, data: { conceptsLearned: completed, quizAccuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : 0, savedLessons, streak, categoryProgress, progress, recentAttempts: attempts.slice(0, 5) } })
})

app.get('/api/saved', requireAuth, async (request: AuthenticatedRequest, response) => {
  const saved = await SavedLesson.find({ userId: request.userId }).sort({ createdAt: -1 }).lean()
  const lessons = await Lesson.find({ slug: { $in: saved.map((item) => item.lessonSlug) } }).lean()
  response.json({ success: true, data: lessons })
})

app.post('/api/saved/:lessonSlug', requireAuth, async (request: AuthenticatedRequest, response) => {
  await SavedLesson.updateOne({ userId: request.userId, lessonSlug: request.params.lessonSlug }, { userId: request.userId, lessonSlug: request.params.lessonSlug }, { upsert: true })
  response.status(201).json({ success: true, data: { saved: true, lessonSlug: request.params.lessonSlug } })
})

app.delete('/api/saved/:lessonSlug', requireAuth, async (request: AuthenticatedRequest, response) => {
  await SavedLesson.deleteOne({ userId: request.userId, lessonSlug: request.params.lessonSlug })
  response.json({ success: true, data: { saved: false, lessonSlug: request.params.lessonSlug } })
})

app.get('/api/quizzes/:lessonSlug', requireAuth, async (request, response) => {
  const quiz = await Quiz.findOne({ lessonSlug: request.params.lessonSlug }).select('-answer').lean()
  if (!quiz) {
    response.status(404).json({ success: false, error: 'Quiz not found' })
    return
  }
  response.json({ success: true, data: quiz })
})

app.post('/api/quizzes/:lessonSlug/attempt', requireAuth, async (request: AuthenticatedRequest, response) => {
  const lessonSlug = typeof request.params.lessonSlug === 'string' ? request.params.lessonSlug : request.params.lessonSlug[0]
  const quiz = await Quiz.findOne({ lessonSlug: request.params.lessonSlug }).lean()
  const answer = Number(request.body.answer)
  if (!quiz || !Number.isInteger(answer) || answer < 0 || answer >= quiz.options.length) {
    response.status(400).json({ success: false, error: 'Choose a valid answer' })
    return
  }
  const correct = answer === quiz.answer
  await QuizAttempt.create({ userId: request.userId, lessonSlug, answer, correct })
  response.json({ success: true, data: { correct, explanation: quiz.explanation } })
})

app.post('/api/tutor', requireAuth, async (request, response) => {
  const prompt = typeof request.body.prompt === 'string' ? request.body.prompt.trim() : ''
  const lesson = typeof request.body.lessonSlug === 'string' ? await Lesson.findOne({ slug: request.body.lessonSlug }).lean() : null
  if (!prompt) {
    response.status(400).json({ success: false, error: 'Ask a question first' })
    return
  }
  const context = lesson ? ` about ${lesson.title}: ${lesson.explanation}` : ''
  response.json({ success: true, data: { answer: `Here is a simple way to think about it${context}. Try explaining the idea in your own words, then check which part still feels unclear.` } })
})

app.get('/api/lessons/:slug', async (request, response) => {
  const lesson = await Lesson.findOne({ slug: request.params.slug }).lean()

  if (!lesson) {
    response.status(404).json({ success: false, error: 'Lesson not found' })
    return
  }

  response.json({ success: true, data: lesson })
})
import cors from 'cors'
import express from 'express'
import { comparePassword, createToken, hashPassword, requireAuth, type AuthenticatedRequest } from './auth.js'
import { Lesson } from './models/lesson.js'
import { Progress } from './models/progress.js'
import { Quiz } from './models/quiz.js'
import { QuizAttempt } from './models/quizAttempt.js'
import { SavedLesson } from './models/savedLesson.js'
import { User } from './models/user.js'
import { seedData } from './seed.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.post('/api/auth/signup', async (request, response) => {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const username = typeof request.body.username === 'string' ? request.body.username.trim().toLowerCase() : ''
  const displayName = typeof request.body.displayName === 'string' ? request.body.displayName.trim() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  const confirmPassword = typeof request.body.confirmPassword === 'string' ? request.body.confirmPassword : ''
  const age = Number(request.body.age)
  const grade = typeof request.body.grade === 'string' && request.body.grade.trim() ? request.body.grade.trim() : 'General'

  if (!email || !username || !displayName || !age || age < 5 || age > 120 || password.length < 8 || password !== confirmPassword) {
    response.status(400).json({ success: false, error: 'Complete all fields, enter a valid age (5-120), and make sure passwords match' })
    return
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] })
  if (existingUser) {
    response.status(409).json({ success: false, error: 'That email or username is already in use' })
    return
  }

  const role = email.endsWith('@bolt.admin') || username.includes('admin') ? 'admin' : 'user'
  const user = await User.create({ email, username, displayName, age, grade, passwordHash: await hashPassword(password), xp: 0, streak: 0, completedCount: 0, role, bio: 'Curious learner on Bolt', avatar: '', followers: [], following: [] })
  response.status(201).json({
    success: true,
    data: {
      token: createToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        interests: user.interests,
        age: user.age,
        grade: user.grade,
        xp: user.xp,
        streak: user.streak,
        completedCount: user.completedCount,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
    },
  })
})

app.post('/api/auth/login', async (request, response) => {
  const loginInput = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  const user = await User.findOne({ $or: [{ email: loginInput }, { username: loginInput }] })

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    response.status(401).json({ success: false, error: 'Email/username or password is incorrect' })
    return
  }

  response.json({
    success: true,
    data: {
      token: createToken(user.id),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        interests: user.interests,
        age: user.age,
        grade: user.grade,
        xp: user.xp ?? 0,
        streak: user.streak ?? 0,
        completedCount: user.completedCount ?? 0,
        role: user.role ?? 'user',
        bio: user.bio ?? '',
        avatar: user.avatar ?? '',
        followersCount: user.followers?.length ?? 0,
        followingCount: user.following?.length ?? 0,
      },
    },
  })
})

app.get('/api/auth/me', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()

  if (!user) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  response.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      interests: user.interests,
      age: user.age,
      grade: user.grade,
      xp: user.xp ?? 0,
      streak: user.streak ?? 0,
      completedCount: user.completedCount ?? 0,
      role: user.role ?? 'user',
      bio: user.bio ?? '',
      avatar: user.avatar ?? '',
      followersCount: user.followers?.length ?? 0,
      followingCount: user.following?.length ?? 0,
    },
  })
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
  const lessons = await Lesson.find({ status: { $ne: 'rejected' } }).sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: lessons })
})

app.get('/api/lessons/search', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : ''
  const category = typeof request.query.category === 'string' ? request.query.category.trim() : ''

  const filter: Record<string, unknown> = { status: { $ne: 'rejected' } }

  if (category && category !== 'All') {
    filter.category = new RegExp(`^${category}$`, 'i')
  }

  if (query) {
    const regex = new RegExp(query, 'i')
    filter.$or = [
      { title: regex },
      { topic: regex },
      { category: regex },
      { explanation: regex },
      { takeaway: regex },
      { relatedTopics: regex },
    ]
  }

  const lessons = await Lesson.find(filter).sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: lessons })
})

app.get('/api/categories', async (_request, response) => {
  response.json({ success: true, data: await Lesson.distinct('category', { status: { $ne: 'rejected' } }) })
})

app.get('/api/feed', requireAuth, async (request: AuthenticatedRequest, response) => {
  const page = Math.max(1, Number(request.query.page) || 1)
  const limit = Math.max(1, Math.min(50, Number(request.query.limit) || 15))
  const user = await User.findById(request.userId).lean()
  const lessons = await Lesson.find({ status: 'approved' }).lean()

  const interests = user?.interests ?? []
  const userAge = user?.age ?? 16
  const userGrade = user?.grade ?? 'General'

  const scoredLessons = lessons.map((lesson) => {
    let score = 0
    if (interests.includes(lesson.category)) score += 12
    const minAge = lesson.minAge ?? 6
    const maxAge = lesson.maxAge ?? 99
    if (userAge >= minAge && userAge <= maxAge) score += 10
    if (userAge < 13 && lesson.difficulty === 'Beginner') score += 8
    if (userAge >= 13 && userAge <= 18 && (lesson.difficulty === 'Beginner' || lesson.difficulty === 'Intermediate')) score += 6
    if (userAge > 18 && (lesson.difficulty === 'Intermediate' || lesson.difficulty === 'Advanced')) score += 6
    if (lesson.gradeLevel === userGrade || lesson.gradeLevel === 'All') score += 4
    return { lesson, score }
  })

  scoredLessons.sort((left, right) => right.score - left.score)
  const allOrderedLessons = scoredLessons.map((item) => item.lesson)

  const startIndex = (page - 1) * limit
  const paginatedLessons = allOrderedLessons.slice(startIndex, startIndex + limit)
  const hasMore = startIndex + limit < allOrderedLessons.length

  response.json({ success: true, data: paginatedLessons, page, hasMore, total: allOrderedLessons.length })
})

app.get('/api/posts/my', requireAuth, async (request: AuthenticatedRequest, response) => {
  const posts = await Lesson.find({ authorId: request.userId }).sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: posts })
})

app.post('/api/posts', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  const title = typeof request.body.title === 'string' ? request.body.title.trim() : ''
  const topic = typeof request.body.topic === 'string' ? request.body.topic.trim() : ''
  const category = typeof request.body.category === 'string' ? request.body.category.trim() : 'Science'
  const explanation = typeof request.body.explanation === 'string' ? request.body.explanation.trim() : ''
  const takeaway = typeof request.body.takeaway === 'string' ? request.body.takeaway.trim() : ''
  const difficulty = typeof request.body.difficulty === 'string' ? request.body.difficulty.trim() : 'Beginner'
  const mediaType = request.body.mediaType === 'video' ? 'video' : 'text'
  const videoUrl = typeof request.body.videoUrl === 'string' ? request.body.videoUrl.trim() : ''

  if (!title || !explanation || !takeaway) {
    response.status(400).json({ success: false, error: 'Please provide a title, explanation, and key takeaway' })
    return
  }

  const slug = `user-${user.username}-${Date.now()}`
  const post = await Lesson.create({
    slug,
    category: category as any,
    title,
    topic: topic || title,
    explanation,
    takeaway,
    difficulty: difficulty as any,
    visualKey: mediaType === 'video' ? 'video' : 'spark',
    relatedTopics: [category.toLowerCase()],
    mediaType,
    videoUrl,
    authorId: user._id.toString(),
    authorName: user.displayName,
    status: 'pending',
    questions: [],
  })

  response.status(201).json({ success: true, data: post })
})

app.post('/api/users/:targetUsername/follow', requireAuth, async (request: AuthenticatedRequest, response) => {
  const currentUser = await User.findById(request.userId)
  const targetUser = await User.findOne({ username: request.params.targetUsername })

  if (!currentUser || !targetUser) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  const isFollowing = currentUser.following.includes(targetUser.username)
  if (isFollowing) {
    currentUser.following = currentUser.following.filter((u) => u !== targetUser.username)
    targetUser.followers = targetUser.followers.filter((u) => u !== currentUser.username)
  } else {
    currentUser.following.push(targetUser.username)
    targetUser.followers.push(currentUser.username)
  }

  await currentUser.save()
  await targetUser.save()

  response.json({ success: true, data: { isFollowing: !isFollowing, followersCount: targetUser.followers.length, followingCount: currentUser.following.length } })
})

app.get('/api/leaderboard', async (_request, response) => {
  const users = await User.find()
    .select('-passwordHash')
    .sort({ xp: -1 })
    .limit(50)
    .lean()

  const leaderboard = users.map((u, index) => ({
    rank: index + 1,
    id: u._id,
    username: u.username,
    displayName: u.displayName,
    age: u.age,
    grade: u.grade,
    xp: u.xp ?? 0,
    streak: u.streak ?? 0,
    completedCount: u.completedCount ?? 0,
    avatar: u.avatar ?? '',
    bio: u.bio ?? '',
  }))

  response.json({ success: true, data: leaderboard })
})

app.get('/api/users/public-suggested', async (_request, response) => {
  const users = await User.find()
    .select('username displayName bio xp avatar grade')
    .sort({ xp: -1 })
    .limit(10)
    .lean()

  const data = users.map((u) => ({
    username: u.username,
    name: u.displayName,
    initials: u.displayName.slice(0, 2).toUpperCase(),
    grade: u.grade || 'General',
    xp: u.xp || 0,
  }))

  response.json({ success: true, data })
})

app.get('/api/users/suggested', requireAuth, async (request: AuthenticatedRequest, response) => {
  const currentUser = await User.findById(request.userId).lean()
  if (!currentUser) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  const query = typeof request.query.q === 'string' ? request.query.q.trim() : ''
  const filter: Record<string, unknown> = {
    _id: { $ne: currentUser._id },
  }
  if (query) {
    filter.$or = [
      { username: new RegExp(query, 'i') },
      { displayName: new RegExp(query, 'i') },
    ]
  }

  const users = await User.find(filter)
    .select('-passwordHash')
    .sort({ xp: -1 })
    .limit(25)
    .lean()

  const data = users.map((u) => ({
    id: u._id,
    name: u.displayName,
    username: u.username,
    bio: u.bio ?? '',
    avatar: u.avatar ?? '',
    xp: u.xp ?? 0,
    grade: u.grade || 'General',
    followersCount: u.followers?.length ?? 0,
    followingCount: u.following?.length ?? 0,
    isFollowing: Array.isArray(currentUser.following) ? currentUser.following.includes(u.username) : false,
  }))

  response.json({ success: true, data })
})

app.get('/api/admin/stats', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  const [totalUsers, totalLessons, pendingCount, totalAttempts] = await Promise.all([
    User.countDocuments(),
    Lesson.countDocuments(),
    Lesson.countDocuments({ status: 'pending' }),
    QuizAttempt.countDocuments(),
  ])

  response.json({ success: true, data: { totalUsers, totalLessons, pendingCount, totalAttempts } })
})

app.get('/api/admin/pending-posts', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  const pendingPosts = await Lesson.find({ status: 'pending' }).sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: pendingPosts })
})

app.post('/api/admin/posts/:slug/approve', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  const post = await Lesson.findOneAndUpdate({ slug: request.params.slug }, { status: 'approved' }, { new: true }).lean()
  if (!post) {
    response.status(404).json({ success: false, error: 'Post not found' })
    return
  }

  if (post.authorId) {
    await User.findByIdAndUpdate(post.authorId, { $inc: { xp: 100 } })
  }

  response.json({ success: true, data: post })
})

app.post('/api/admin/posts/:slug/reject', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  const post = await Lesson.findOneAndUpdate({ slug: request.params.slug }, { status: 'rejected' }, { new: true }).lean()
  if (!post) {
    response.status(404).json({ success: false, error: 'Post not found' })
    return
  }

  response.json({ success: true, data: post })
})

export async function ensureDefaultAdmin() {
  const lessonCount = await Lesson.countDocuments()
  if (lessonCount === 0) {
    await seedData()
  }

  const adminExists = await User.exists({ role: 'admin' })
  if (!adminExists) {
    const passwordHash = await hashPassword('admin123')
    await User.create({
      email: 'admin@bolt.demo',
      username: 'adminbolt',
      displayName: 'Default Admin',
      age: 28,
      grade: 'General',
      passwordHash,
      xp: 1000,
      streak: 10,
      completedCount: 50,
      role: 'admin',
      bio: 'Lead Platform Administrator',
      avatar: '',
      interests: ['AI Skills', 'Web Dev', 'Engineering'],
      followers: [],
      following: [],
    })
  }
}

app.put('/api/users/change-password', requireAuth, async (request: AuthenticatedRequest, response) => {
  const oldPassword = typeof request.body.oldPassword === 'string' ? request.body.oldPassword : ''
  const newPassword = typeof request.body.newPassword === 'string' ? request.body.newPassword : ''

  if (newPassword.length < 8) {
    response.status(400).json({ success: false, error: 'New password must be at least 8 characters long' })
    return
  }

  const user = await User.findById(request.userId)
  if (!user) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  const match = await comparePassword(oldPassword, user.passwordHash)
  if (!match) {
    response.status(400).json({ success: false, error: 'Current password is incorrect' })
    return
  }

  user.passwordHash = await hashPassword(newPassword)
  await user.save()

  response.json({ success: true, data: { message: 'Password updated successfully' } })
})

app.get('/api/admin/users', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean()
  response.json({ success: true, data: users })
})

app.put('/api/admin/users/:userId/role', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  const role = request.body.role === 'admin' ? 'admin' : 'user'
  const updated = await User.findByIdAndUpdate(request.params.userId, { role }, { new: true }).select('-passwordHash').lean()
  if (!updated) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  response.json({ success: true, data: updated })
})

app.put('/api/admin/users/:userId/password', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  const newPassword = typeof request.body.newPassword === 'string' ? request.body.newPassword : ''
  if (newPassword.length < 8) {
    response.status(400).json({ success: false, error: 'New password must be at least 8 characters long' })
    return
  }

  const passwordHash = await hashPassword(newPassword)
  const updated = await User.findByIdAndUpdate(request.params.userId, { passwordHash }, { new: true }).select('-passwordHash').lean()
  if (!updated) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  response.json({ success: true, data: updated })
})

app.delete('/api/admin/users/:userId', requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await User.findById(request.userId).lean()
  if (!user || user.role !== 'admin') {
    response.status(403).json({ success: false, error: 'Admin access required' })
    return
  }

  if (request.params.userId === request.userId) {
    response.status(400).json({ success: false, error: 'You cannot delete your own admin account' })
    return
  }

  const deleted = await User.findByIdAndDelete(request.params.userId).lean()
  if (!deleted) {
    response.status(404).json({ success: false, error: 'User not found' })
    return
  }

  response.json({ success: true, data: { deleted: true, userId: request.params.userId } })
})

app.post('/api/progress/:lessonSlug', requireAuth, async (request: AuthenticatedRequest, response) => {
  const completed = Boolean(request.body.completed)
  const existingProgress = await Progress.findOne({ userId: request.userId, lessonSlug: request.params.lessonSlug }).lean()
  const isFirstCompletion = completed && (!existingProgress || !existingProgress.completed)

  const progress = await Progress.findOneAndUpdate(
    { userId: request.userId, lessonSlug: request.params.lessonSlug },
    { userId: request.userId, lessonSlug: request.params.lessonSlug, completed, viewedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean()

  if (isFirstCompletion) {
    await User.findByIdAndUpdate(request.userId, { $inc: { xp: 50, completedCount: 1 } })
  }

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
  let xpEarned = 0
  if (correct) {
    const lesson = await Lesson.findOne({ slug: lessonSlug }).lean()
    const difficultyPoints: Record<string, number> = {
      Beginner: 50,
      Intermediate: 100,
      Advanced: 150,
    }
    xpEarned = (lesson?.difficulty && difficultyPoints[lesson.difficulty]) || 100
    await User.findByIdAndUpdate(request.userId, { $inc: { xp: xpEarned } })
  }
  await QuizAttempt.create({ userId: request.userId, lessonSlug, answer, correct })
  response.json({ success: true, data: { correct, explanation: quiz.explanation, xpEarned } })
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
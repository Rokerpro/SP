import bcrypt from 'bcryptjs'
import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET ?? 'bolt-development-secret'

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export function createToken(userId: string): string {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' })
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

export function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
  const token = request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    response.status(401).json({ success: false, error: 'Authentication required' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string }
    request.userId = payload.userId
    next()
  } catch {
    response.status(401).json({ success: false, error: 'Invalid session' })
  }
}
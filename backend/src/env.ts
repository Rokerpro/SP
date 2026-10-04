import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootEnvPath = path.resolve(__dirname, '../../.env')
const backendEnvPath = path.resolve(__dirname, '../.env')

// Load environment variables prioritizing .env from backend or root directory
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath })
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
}
dotenv.config()

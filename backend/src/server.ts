import './env.js'
import { app, ensureDefaultAdmin } from './app.js'
import { connectDatabase } from './db.js'

const port = Number(process.env.PORT) || 3001

connectDatabase()
  .then(async () => {
    await ensureDefaultAdmin()
    app.listen(port, () => {
      console.log(`Bolt API listening on http://localhost:${port}`)
    })
  })
  .catch((error: unknown) => {
    console.error('Database connection failed', error)
    process.exitCode = 1
  })
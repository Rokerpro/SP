import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Bolt</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Learn something that sticks.</h1>
        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-100">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          Foundation online
        </div>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
import { useState, type FormEvent } from 'react'
import { ReelCard, type HomeLesson } from '../components/ReelCard'

type DiscoverPageProps = {
  categories: string[]
  lessons: HomeLesson[]
  savedLessons: HomeLesson[]
  searchQuery: string
  tutorPrompt: string
  tutorAnswer: string
  onSearchQueryChange: (query: string) => void
  onSearchSubmit: (e: FormEvent<HTMLFormElement>) => void
  onCategorySelect: (category: string) => void
  onToggleSaved: (lesson: HomeLesson) => void
  onCompleteLesson: (lesson: HomeLesson) => void
  onOpenQuiz: (lesson: HomeLesson) => void
  onTutorPromptChange: (prompt: string) => void
  onAskTutor: (e: FormEvent<HTMLFormElement>) => void
}

export function DiscoverPage({
  categories,
  lessons,
  savedLessons,
  searchQuery,
  tutorPrompt,
  tutorAnswer,
  onSearchQueryChange,
  onSearchSubmit,
  onCategorySelect,
  onToggleSaved,
  onCompleteLesson,
  onOpenQuiz,
  onTutorPromptChange,
  onAskTutor,
}: DiscoverPageProps) {
  const [selectedCat, setSelectedCat] = useState<string>('All')

  return (
    <div className="discover-page-container">
      <header className="page-header">
        <span className="eyebrow">EXPLORE & LEARN</span>
        <h1>Discover Topics</h1>
        <p>Find educational reels across science, tech, history, psychology, and more.</p>
      </header>

      <form className="search-bar-form" onSubmit={onSearchSubmit}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by topic, title, or keyword..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="category-pills-row">
        <button
          type="button"
          className={`category-pill-btn ${selectedCat === 'All' ? 'active' : ''}`}
          onClick={() => {
            setSelectedCat('All')
            onCategorySelect('')
          }}
        >
          All Topics
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`category-pill-btn ${selectedCat === cat ? 'active' : ''}`}
            onClick={() => {
              setSelectedCat(cat)
              onCategorySelect(cat)
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="tutor-box-card">
        <div className="tutor-header">
          <span className="tutor-badge">🤖 AI Learning Assistant</span>
          <h3>Have a question about any reel?</h3>
        </div>
        <form onSubmit={onAskTutor} className="tutor-input-form">
          <input
            type="text"
            placeholder="e.g. Can you explain Rayleigh scattering simply?"
            value={tutorPrompt}
            onChange={(e) => onTutorPromptChange(e.target.value)}
            required
          />
          <button type="submit">Ask AI</button>
        </form>
        {tutorAnswer && (
          <div className="tutor-answer-box">
            <p>{tutorAnswer}</p>
          </div>
        )}
      </section>

      <section className="discover-results-section">
        <h2>Reels ({lessons.length})</h2>
        <div className="reels-grid">
          {lessons.map((lesson) => (
            <ReelCard
              key={lesson.slug}
              lesson={lesson}
              isSaved={savedLessons.some((item) => item.slug === lesson.slug)}
              onToggleSave={onToggleSaved}
              onComplete={onCompleteLesson}
              onOpenQuiz={onOpenQuiz}
            />
          ))}
          {lessons.length === 0 && (
            <p className="empty-state">No reels found for your query. Try another search!</p>
          )}
        </div>
      </section>
    </div>
  )
}

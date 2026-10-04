import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { ReelCard, type HomeLesson } from '../components/ReelCard'

type DiscoverPageProps = {
  categories: string[]
  lessons: HomeLesson[]
  savedLessons: HomeLesson[]
  searchQuery: string
  tutorPrompt: string
  tutorAnswer: string
  isTutorLoading?: boolean
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
  isTutorLoading = false,
  onSearchQueryChange,
  onSearchSubmit: _onSearchSubmit,
  onCategorySelect,
  onToggleSaved,
  onCompleteLesson,
  onOpenQuiz,
  onTutorPromptChange,
  onAskTutor,
}: DiscoverPageProps) {
  const [selectedCat, setSelectedCat] = useState<string>('All')
  const [localLessons, setLocalLessons] = useState<HomeLesson[]>(lessons)
  const [isSearching, setIsSearching] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

  // Execute search with query and category
  const runSearch = useCallback(
    async (queryText: string, cat: string) => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams()
        if (queryText.trim()) params.set('q', queryText.trim())
        if (cat && cat !== 'All') params.set('category', cat)

        const url = params.toString()
          ? `${apiUrl}/lessons/search?${params.toString()}`
          : `${apiUrl}/lessons`

        const res = await fetch(url)
        const result = await res.json()
        if (result.success && Array.isArray(result.data)) {
          setLocalLessons(result.data)
        }
      } catch (err) {
        console.error('Failed to search lessons:', err)
      } finally {
        setIsSearching(false)
      }
    },
    [apiUrl]
  )

  // Fetch full catalog on initial mount
  useEffect(() => {
    runSearch('', 'All')
  }, [runSearch])

  // Debounced search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(searchQuery, selectedCat)
    }, 280)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCat, runSearch])

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    runSearch(searchQuery, selectedCat)
  }

  const handleClearSearch = () => {
    onSearchQueryChange('')
    runSearch('', selectedCat)
  }

  const handleSelectCategory = (cat: string) => {
    setSelectedCat(cat)
    onCategorySelect(cat === 'All' ? '' : cat)
    runSearch(searchQuery, cat)
  }

  const handleResetFilters = () => {
    setSelectedCat('All')
    onSearchQueryChange('')
    onCategorySelect('')
    runSearch('', 'All')
  }

  return (
    <div className="discover-page-container">
      <header className="page-header">
        <span className="eyebrow">EXPLORE &amp; LEARN</span>
        <h1>Discover Topics</h1>
        <p>Find educational reels across science, tech, history, psychology, and more.</p>
      </header>

      {/* Search Bar */}
      <form className="search-bar-form" onSubmit={handleFormSubmit}>
        <span className="search-icon"><i className="fa-solid fa-magnifying-glass" /></span>
        <input
          type="text"
          placeholder="Search by topic, title, takeaway, or keyword..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClearSearch}
            title="Clear search"
            aria-label="Clear search"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
        <button type="submit">
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Category Pills */}
      <div className="category-pills-row">
        <button
          type="button"
          className={`category-pill-btn ${selectedCat === 'All' ? 'active' : ''}`}
          onClick={() => handleSelectCategory('All')}
        >
          All Topics
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`category-pill-btn ${selectedCat === cat ? 'active' : ''}`}
            onClick={() => handleSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* AI Assistant */}
      <section className="tutor-box-card">
        <div className="tutor-header">
          <span className="tutor-badge">
            <i className="fa-solid fa-robot" style={{ marginRight: 6 }} /> AI Learning Assistant
          </span>
          <h3>Have a question about any reel?</h3>
        </div>
        <form onSubmit={onAskTutor} className="tutor-input-form">
          <input
            type="text"
            placeholder="e.g. Can you explain Rayleigh scattering simply?"
            value={tutorPrompt}
            onChange={(e) => onTutorPromptChange(e.target.value)}
            disabled={isTutorLoading}
            required
          />
          <button type="submit" disabled={isTutorLoading}>
            {isTutorLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </form>
        {isTutorLoading && (
          <div className="tutor-answer-box tutor-loading-state">
            <div className="tutor-spinner"></div>
            <span>Consulting Gemini AI...</span>
          </div>
        )}
        {!isTutorLoading && tutorAnswer && (
          <div className="tutor-answer-box">
            <p>{tutorAnswer}</p>
          </div>
        )}
      </section>

      {/* Results Section */}
      <section className="discover-results-section">
        <h2>
          Reels ({localLessons.length})
          {selectedCat !== 'All' && <span style={{ color: '#818cf8', fontSize: '0.9rem', fontWeight: 600, marginLeft: 8 }}>· {selectedCat}</span>}
        </h2>
        <div className="reels-grid">
          {localLessons.map((lesson) => (
            <ReelCard
              key={lesson.slug}
              lesson={lesson}
              isSaved={savedLessons.some((item) => item.slug === lesson.slug)}
              onToggleSave={onToggleSaved}
              onComplete={onCompleteLesson}
              onOpenQuiz={onOpenQuiz}
            />
          ))}
          {localLessons.length === 0 && !isSearching && (
            <div className="discover-empty-state">
              <p>
                No reels found
                {searchQuery ? (
                  <> matching <strong>"{searchQuery}"</strong></>
                ) : null}
                {selectedCat !== 'All' ? ` in ${selectedCat}` : ''}.
              </p>
              <button
                type="button"
                className="discover-reset-btn"
                onClick={handleResetFilters}
              >
                Reset filters &amp; show all reels
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { ReelCard, type HomeLesson } from '../components/ReelCard'
import { CardDeck, type DeckTheme } from '../components/CardDeck'
import { DUMMY_CARD_DECKS } from '../data/dummyDecks'
import { VoltIcon } from '../components/VoltIcon'

type HomePageProps = {
  lessons: HomeLesson[]
  savedLessons: HomeLesson[]
  onToggleSaved: (lesson: HomeLesson) => void
  onCompleteLesson: (lesson: HomeLesson) => void
  onOpenQuiz: (lesson: HomeLesson) => void
}

export function HomePage({
  lessons,
  savedLessons,
  onToggleSaved,
  onCompleteLesson,
  onOpenQuiz,
}: HomePageProps) {
  const [viewMode, setViewMode] = useState<'decks' | 'feed'>('decks')
  const [activeDeckIndex, setActiveDeckIndex] = useState(0)
  const [lessonIndex, setLessonIndex] = useState(0)

  useEffect(() => {
    setLessonIndex(0)
  }, [lessons])

  // Combine dummy decks with dynamic community feed deck
  const dynamicDecks: DeckTheme[] = [...DUMMY_CARD_DECKS]

  if (lessons && lessons.length > 0) {
    dynamicDecks.unshift({
      id: 'deck-community-feed',
      title: 'Community Volt Feed',
      category: 'Explore All',
      description: 'Trending educational posts from the community.',
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #2b1055 0%, #4c62b3 100%)',
      cards: lessons,
    })
  }

  const currentDeck = dynamicDecks[activeDeckIndex] || dynamicDecks[0]

  const reelLessons = lessons.slice(0, 30)
  const reelSequence = reelLessons.reduce<Array<{ type: 'lesson' | 'quiz'; lesson: HomeLesson }>>(
    (items, lesson, index) => {
      items.push({ type: 'lesson', lesson })
      if ((index + 1) % 3 === 0 && index < reelLessons.length - 1) {
        items.push({ type: 'quiz', lesson })
      }
      return items
    },
    []
  )

  const currentItem = reelSequence[lessonIndex]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode === 'feed') {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        setLessonIndex((idx) => Math.min(reelSequence.length - 1, idx + 1))
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        setLessonIndex((idx) => Math.max(0, idx - 1))
      }
    }
  }

  return (
    <div className="reels-feed-container" tabIndex={0} onKeyDown={handleKeyDown}>
      {/* View Switcher Bar */}
      <div className="reels-view-switcher">
        <div className="view-mode-tabs">
          <button
            type="button"
            className={`view-tab-btn ${viewMode === 'decks' ? 'active' : ''}`}
            onClick={() => setViewMode('decks')}
          >
            🎴 Card Decks
          </button>
          <button
            type="button"
            className={`view-tab-btn ${viewMode === 'feed' ? 'active' : ''}`}
            onClick={() => setViewMode('feed')}
          >
            <VoltIcon width={18} height={18} /> Volt Feed
          </button>
        </div>
      </div>

      {viewMode === 'decks' ? (
        <div className="card-decks-section">
          {/* Deck Selector Horizontal Scroll */}
          <div className="deck-selector-scroll">
            {dynamicDecks.map((deck, idx) => (
              <button
                key={deck.id}
                type="button"
                className={`deck-pill-btn ${activeDeckIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveDeckIndex(idx)}
              >
                <span className="pill-icon">{deck.icon}</span>
                <span className="pill-title">{deck.title}</span>
                <span className="pill-count">{deck.cards.length} cards</span>
              </button>
            ))}
          </div>

          {/* Active Card Deck View */}
          {currentDeck ? (
            <CardDeck
              key={currentDeck.id}
              deck={currentDeck}
              savedLessons={savedLessons}
              onToggleSave={onToggleSaved}
              onComplete={onCompleteLesson}
              onOpenQuiz={onOpenQuiz}
              onSelectNextDeck={() =>
                setActiveDeckIndex((prev) => (prev + 1) % dynamicDecks.length)
              }
            />
          ) : (
            <div className="empty-state">
              <p>No card decks available right now.</p>
            </div>
          )}
        </div>
      ) : (
        /* Single Reel Feed Mode */
        <div className="single-reel-viewport">
          {currentItem ? (
            <>
              {currentItem.type === 'quiz' ? (
                <div className="quiz-card-inline">
                  <span className="eyebrow">POP QUIZ CHECK</span>
                  <h2>Test what you just learned!</h2>
                  <p>Reel: <strong>{currentItem.lesson.title}</strong></p>
                  <button
                    type="button"
                    className="quiz-trigger-btn"
                    onClick={() => onOpenQuiz(currentItem.lesson)}
                  >
                    🧠 Start Quiz Question
                  </button>
                </div>
              ) : (
                <ReelCard
                  lesson={currentItem.lesson}
                  isSaved={savedLessons.some((item) => item.slug === currentItem.lesson.slug)}
                  onToggleSave={onToggleSaved}
                  onComplete={onCompleteLesson}
                  onOpenQuiz={onOpenQuiz}
                />
              )}

              <div className="reel-stepper-control" aria-label="Reel Navigation">
                <button
                  type="button"
                  aria-label="Previous reel"
                  disabled={lessonIndex === 0}
                  onClick={() => setLessonIndex((idx) => Math.max(0, idx - 1))}
                >
                  ▲
                </button>
                <span className="stepper-counter">
                  {reelSequence.length ? `${lessonIndex + 1} / ${reelSequence.length}` : '0 / 0'}
                </span>
                <button
                  type="button"
                  aria-label="Next reel"
                  disabled={lessonIndex >= reelSequence.length - 1}
                  onClick={() => setLessonIndex((idx) => Math.min(reelSequence.length - 1, idx + 1))}
                >
                  ▼
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No educational reels found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

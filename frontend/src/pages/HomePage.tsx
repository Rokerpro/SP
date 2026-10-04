import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReelCard, type HomeLesson } from '../components/ReelCard'
import { CardDeck, type DeckTheme } from '../components/CardDeck'
import { DUMMY_CARD_DECKS } from '../data/dummyDecks'
import { VOLT_THEME_DECKS, ALL_VOLT_FEED_LESSONS } from '../data/dummyVoltFeed'
import { VoltIcon } from '../components/VoltIcon'
import { DynamicIcon } from '../components/DynamicIcon'

type HomeUser = {
  displayName: string
  username: string
  interests?: string[]
  xp?: number
  streak?: number
}

type HomePageProps = {
  lessons: HomeLesson[]
  savedLessons: HomeLesson[]
  onToggleSaved: (lesson: HomeLesson) => void
  onCompleteLesson: (lesson: HomeLesson) => void
  onOpenQuiz: (lesson: HomeLesson) => void
  user?: HomeUser | null
}

type FeedSequenceItem =
  | { type: 'lesson'; lesson: HomeLesson }
  | {
      type: 'quiz'
      lesson: HomeLesson
      question: string
      options: string[]
      correctIndex: number
      explanation: string
    }

const INTEREST_ALIASES: Record<string, string[]> = {
  'creative writing': ['sustainability', 'writing', 'storytelling'],
  'ux clarity': ['ux design', 'design', 'user empathy'],
}

function normalizeInterest(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function lessonMatchesInterests(lesson: HomeLesson, interests: string[]): boolean {
  const lessonText = normalizeInterest(
    [lesson.category, lesson.title, lesson.topic, ...lesson.relatedTopics].join(' ')
  )

  return interests.some((interest) => {
    const normalized = normalizeInterest(interest)
    if (normalized && lessonText.includes(normalized)) return true
    return (INTEREST_ALIASES[normalized] ?? []).some((alias) => lessonText.includes(alias))
  })
}

export function HomePage({
  lessons,
  savedLessons,
  onToggleSaved,
  onCompleteLesson,
  onOpenQuiz,
  user,
}: HomePageProps) {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'decks' | 'feed'>('feed')
  const [activeDeckIndex, setActiveDeckIndex] = useState(0)
  const [feedThemeId, setFeedThemeId] = useState<string>('for-you')
  const [lessonIndex, setLessonIndex] = useState(0)
  const [isFeedMuted, setIsFeedMuted] = useState(true)
  const lastWheelTime = useRef(0)
  const touchStartY = useRef<number | null>(null)

  // Reset lesson index when theme or lessons change
  useEffect(() => {
    setLessonIndex(0)
  }, [lessons, feedThemeId, viewMode])

  // Combine Volt Theme Decks with custom card decks and dynamic community feed deck
  const dynamicDecks: DeckTheme[] = useMemo(() => {
    const list: DeckTheme[] = [...DUMMY_CARD_DECKS]

    if (lessons && lessons.length > 0) {
      list.unshift({
        id: 'deck-community-feed',
        title: 'Community Volt Feed',
        category: 'Explore All',
        description: 'Trending educational posts from the community.',
        icon: '⚡',
        gradient: 'linear-gradient(135deg, #2b1055 0%, #4c62b3 100%)',
        cards: lessons,
      })
    }

    return list
  }, [lessons])

  const currentDeck = dynamicDecks[activeDeckIndex] || dynamicDecks[0]

  // All feed lessons combining volt-vids themes and any community lessons
  const allFeedLessons = useMemo(() => {
    return [...ALL_VOLT_FEED_LESSONS, ...(lessons || [])]
  }, [lessons])

  const forYouLessons = useMemo(() => {
    const interests = (user?.interests ?? []).filter((interest) => interest.trim().length > 0)
    const candidates = interests.length > 0
      ? allFeedLessons.filter((lesson) => lessonMatchesInterests(lesson, interests))
      : allFeedLessons
    const categoryBuckets = new Map<string, HomeLesson[]>()
    candidates.forEach((lesson) => {
      const bucket = categoryBuckets.get(lesson.category) ?? []
      bucket.push(lesson)
      categoryBuckets.set(lesson.category, bucket)
    })

    const shuffle = <T,>(items: T[]) => {
      const shuffled = [...items]
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
      }
      return shuffled
    }

    const buckets = shuffle([...categoryBuckets.values()].map(shuffle))
    const mixed: HomeLesson[] = []
    while (buckets.some((bucket) => bucket.length > 0)) {
      buckets.forEach((bucket) => {
        const nextLesson = bucket.shift()
        if (nextLesson) mixed.push(nextLesson)
      })
    }
    return mixed
  }, [allFeedLessons, user?.interests])

  const interestedThemeDecks = useMemo(() => {
    const interests = (user?.interests ?? []).filter((interest) => interest.trim().length > 0)
    if (interests.length === 0) return VOLT_THEME_DECKS
    return VOLT_THEME_DECKS.filter((theme) =>
      theme.cards.some((lesson) => lessonMatchesInterests(lesson, interests))
    )
  }, [user?.interests])

  // Active feed lessons based on selected theme pill in Volt Feed
  const activeFeedLessons = useMemo(() => {
    if (feedThemeId === 'for-you') return forYouLessons
    const matched = interestedThemeDecks.find((theme) => theme.id === feedThemeId)
    return matched
      ? matched.cards.filter((lesson) => lessonMatchesInterests(lesson, user?.interests ?? []))
      : forYouLessons
  }, [feedThemeId, forYouLessons, interestedThemeDecks, user?.interests])

  // Match the deck rhythm: add a quick quiz after every two reels and at the end.
  const reelSequence = useMemo(() => {
    const reelLessons = activeFeedLessons.slice(0, 50)
    return reelLessons.reduce<FeedSequenceItem[]>(
      (items, lesson, index) => {
        items.push({ type: 'lesson', lesson })
        if ((index + 1) % 2 === 0 || index === reelLessons.length - 1) {
          const distractors = allFeedLessons
            .filter((candidate) => candidate.slug !== lesson.slug)
            .map((candidate) => candidate.takeaway)
            .filter((takeaway, takeawayIndex, takeaways) => takeaways.indexOf(takeaway) === takeawayIndex)
            .slice(0, 3)
          const options = [lesson.takeaway, ...distractors]
          const correctIndex = lesson.slug.length % options.length
          const [correctOption] = options.splice(0, 1)
          options.splice(correctIndex, 0, correctOption)

          items.push({
            type: 'quiz',
            lesson,
            question: `Which takeaway best matches “${lesson.title}”?`,
            options,
            correctIndex,
            explanation: lesson.takeaway,
          })
        }
        return items
      },
      []
    )
  }, [activeFeedLessons, allFeedLessons])

  const currentItem = reelSequence[lessonIndex]
  const nextFeedVideo = reelSequence
    .slice(lessonIndex + 1)
    .find((item) => item.type === 'lesson' && item.lesson.mediaType === 'video' && item.lesson.videoUrl)
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null)

  useEffect(() => {
    setSelectedQuizAnswer(null)
  }, [lessonIndex])

  const showPreviousReel = () => setLessonIndex((index) => Math.max(0, index - 1))
  const showNextReel = () =>
    setLessonIndex((index) => Math.min(reelSequence.length - 1, index + 1))

  const showQuizForLesson = (lesson: HomeLesson) => {
    const lessonPosition = reelSequence.findIndex(
      (item) => item.type === 'lesson' && item.lesson.slug === lesson.slug
    )
    const quizPosition = reelSequence.findIndex(
      (item, index) => index > lessonPosition && item.type === 'quiz' && item.lesson.slug === lesson.slug
    )
    if (quizPosition >= 0) setLessonIndex(quizPosition)
  }

  useEffect(() => {
    if (viewMode !== 'feed') return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        showNextReel()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        showPreviousReel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode, reelSequence.length])

  const handleFeedWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) < 30) return
    const now = Date.now()
    if (now - lastWheelTime.current < 450) return

    if (event.deltaY > 0) showNextReel()
    else showPreviousReel()
    lastWheelTime.current = now
  }

  const handleFeedTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  const handleFeedTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return
    const distance = touchStartY.current - (event.changedTouches[0]?.clientY ?? touchStartY.current)
    if (Math.abs(distance) > 45) {
      if (distance > 0) showNextReel()
      else showPreviousReel()
    }
    touchStartY.current = null
  }

  return (
    <div className={`reels-feed-container ${viewMode === 'feed' ? 'is-feed-mode' : 'is-deck-mode'}`}>
      {/* Top Bar: Profile badge (left) + View switcher (center) */}
      <div className="reels-view-switcher">
        {/* Profile badge — top left */}
        {user && (
          <button
            type="button"
            className="home-profile-badge"
            onClick={() => navigate('/profile')}
            title={`@${user.username} — view profile`}
          >
            <div className="home-profile-avatar">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="home-profile-info">
              <span className="home-profile-name">{user.displayName}</span>
              <div className="home-profile-stats">
                {user.xp !== undefined && (
                  <span>
                    <i className="fa-solid fa-bolt" style={{ color: '#eab308', marginRight: 3 }} />
                    {user.xp} XP
                  </span>
                )}
                {user.streak !== undefined && user.streak > 0 && (
                  <span>
                    <i className="fa-solid fa-fire" style={{ color: '#f97316', marginRight: 3 }} />
                    {user.streak}
                  </span>
                )}
              </div>
            </div>
          </button>
        )}

        {/* Center: view mode tabs */}
        <div className="view-mode-tabs">
          <button
            type="button"
            className={`view-tab-btn ${viewMode === 'decks' ? 'active' : ''}`}
            onClick={() => setViewMode('decks')}
          >
            <i className="fa-solid fa-layer-group" style={{ marginRight: 8 }} /> Volt Decks
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
        /* Volt Decks Section */
        <div className="card-decks-section deck-stage-layout">
          <aside className="deck-selector-scroll deck-theme-selector-scroll" aria-label="Deck categories">
            {dynamicDecks.map((deck, idx) => (
              <button
                key={deck.id}
                type="button"
                className={`deck-pill-btn ${activeDeckIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveDeckIndex(idx)}
              >
                <span className="pill-icon"><DynamicIcon name={deck.icon} /></span>
                <span className="pill-title">{deck.title}</span>
              </button>
            ))}
          </aside>

          {/* Active Volt Deck View */}
          <div className="deck-active-panel">
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
                <p>No volt decks available right now.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Volt Feed Mode */
        <div className="volt-feed-section">
          {/* For You mixes matching interests; the remaining filters stay available. */}
          <aside className="deck-selector-scroll feed-theme-selector-scroll" aria-label="Feed topics">
            <button
              type="button"
              className={`deck-pill-btn ${feedThemeId === 'for-you' ? 'active' : ''}`}
              onClick={() => {
                setFeedThemeId('for-you')
                setLessonIndex(0)
              }}
            >
              <span className="pill-icon"><i className="fa-solid fa-wand-magic-sparkles" /></span>
              <span className="pill-title">For You</span>
            </button>

            {interestedThemeDecks.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={`deck-pill-btn ${feedThemeId === theme.id ? 'active' : ''}`}
                onClick={() => {
                  setFeedThemeId(theme.id)
                  setLessonIndex(0)
                }}
              >
                <span className="pill-icon"><DynamicIcon name={theme.icon} /></span>
                <span className="pill-title">{theme.title}</span>
              </button>
            ))}
          </aside>

          {/* One full-height reel at a time; wheel, keys and buttons advance by one. */}
          <div
            className="single-reel-viewport"
            onWheel={handleFeedWheel}
            onTouchStart={handleFeedTouchStart}
            onTouchEnd={handleFeedTouchEnd}
          >
            {currentItem ? (
              <>
                <div className="feed-reel-row" key={`${currentItem.type}-${currentItem.lesson.slug}`}>
                <div className="feed-navigation-strip">
                  <button
                    type="button"
                    className="deck-strip-btn nav-btn"
                    aria-label="Previous reel"
                    title="Previous reel (↑)"
                    disabled={lessonIndex === 0}
                    onClick={showPreviousReel}
                  >
                    <span className="strip-icon"><i className="fa-solid fa-arrow-up" /></span>
                    <span className="strip-label">Prev</span>
                  </button>
                  <button
                    type="button"
                    className="deck-strip-btn nav-btn primary-next"
                    aria-label="Next reel"
                    title="Next reel (↓)"
                    disabled={lessonIndex >= reelSequence.length - 1}
                    onClick={showNextReel}
                  >
                    <span className="strip-icon"><i className="fa-solid fa-arrow-down" /></span>
                    <span className="strip-label">Next</span>
                  </button>
                </div>

                {currentItem.type === 'quiz' ? (
                  <div className="reel-card-layout-wrapper feed-quiz-layout">
                    <div className="quiz-card-inline">
                      <span className="eyebrow"><i className="fa-solid fa-brain" /> QUICK CHECK</span>
                      <h2>{currentItem.question}</h2>
                      <p>From the reel: <strong>{currentItem.lesson.title}</strong></p>
                      <div className="quiz-deck-options feed-quiz-options">
                        {currentItem.options.map((option, optionIndex) => {
                          const isSelected = selectedQuizAnswer === optionIndex
                          const isCorrect = optionIndex === currentItem.correctIndex
                          let optionClass = 'quiz-deck-opt-btn'

                          if (selectedQuizAnswer !== null) {
                            if (isCorrect) optionClass += ' correct'
                            else if (isSelected) optionClass += ' incorrect'
                          }

                          return (
                            <button
                              key={`${currentItem.lesson.slug}-${optionIndex}`}
                              type="button"
                              className={optionClass}
                              disabled={selectedQuizAnswer !== null}
                              onClick={() => setSelectedQuizAnswer(optionIndex)}
                            >
                              <span className="opt-letter">{String.fromCharCode(65 + optionIndex)}</span>
                              <span className="opt-text">{option}</span>
                            </button>
                          )
                        })}
                      </div>
                      {selectedQuizAnswer !== null && (
                        <div className={`quiz-feedback-banner ${selectedQuizAnswer === currentItem.correctIndex ? 'success' : 'wrong'}`}>
                          <p>
                            <strong>{selectedQuizAnswer === currentItem.correctIndex ? 'Correct!' : 'Not quite.'}</strong>{' '}
                            {currentItem.explanation}
                          </p>
                          <button type="button" className="quiz-trigger-btn" onClick={showNextReel}>
                            Continue <i className="fa-solid fa-arrow-down" style={{ marginLeft: 8 }} />
                          </button>
                        </div>
                      )}
                    </div>
                    <aside className="deck-right-strip" aria-label="Quiz actions">
                      <button
                        type="button"
                        className="deck-strip-btn quiz-strip-btn"
                        onClick={showNextReel}
                        title="Continue feed"
                      >
                        <span className="strip-icon"><i className="fa-solid fa-arrow-down" /></span>
                        <span className="strip-label">Next</span>
                      </button>
                    </aside>
                  </div>
                ) : (
                  <ReelCard
                    key={currentItem.lesson.slug}
                    lesson={currentItem.lesson}
                    isSaved={savedLessons.some((item) => item.slug === currentItem.lesson.slug)}
                    onToggleSave={onToggleSaved}
                    onComplete={onCompleteLesson}
                    onOpenQuiz={() => showQuizForLesson(currentItem.lesson)}
                    isMuted={isFeedMuted}
                    onMuteChange={setIsFeedMuted}
                  />
                )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No educational reels found matching your criteria.</p>
              </div>
            )}
          </div>
          {nextFeedVideo?.type === 'lesson' && nextFeedVideo.lesson.videoUrl && (
            <video
              src={nextFeedVideo.lesson.videoUrl}
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
              className="feed-video-preload"
            />
          )}
        </div>
      )}
    </div>
  )
}

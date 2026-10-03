import { useState, useEffect, useCallback } from 'react'
import type { HomeLesson } from './ReelCard'

export type DeckTheme = {
  id: string
  title: string
  category: string
  description: string
  icon: string
  gradient: string
  cards: HomeLesson[]
}

export type DeckSequenceItem =
  | { type: 'lesson'; lesson: HomeLesson }
  | {
      type: 'quiz'
      lesson: HomeLesson
      question: string
      options: string[]
      correctIndex: number
      explanation: string
    }

const XP_BY_DIFFICULTY: Record<string, number> = {
  Beginner: 10,
  Intermediate: 20,
  Advanced: 30,
}

export function getQuizXp(difficulty?: string): number {
  if (!difficulty) return 15
  return XP_BY_DIFFICULTY[difficulty] ?? 15
}

type CardDeckProps = {
  deck: DeckTheme
  savedLessons: HomeLesson[]
  onToggleSave: (lesson: HomeLesson) => void
  onComplete: (lesson: HomeLesson) => void
  onOpenQuiz: (lesson: HomeLesson) => void
  onSelectNextDeck?: () => void
}

export function CardDeck({
  deck,
  savedLessons,
  onToggleSave,
  onComplete,
  onOpenQuiz,
  onSelectNextDeck,
}: CardDeckProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null)
  const [quizScore, setQuizScore] = useState(0)

  // Interleave a Pop Quiz card after every 2 lesson cards
  const deckSequence: DeckSequenceItem[] = []
  deck.cards.forEach((lesson, index) => {
    deckSequence.push({ type: 'lesson', lesson })

    if ((index + 1) % 2 === 0 || index === deck.cards.length - 1) {
      const options = [
        lesson.takeaway,
        'It occurs strictly under hypothetical black hole conditions.',
        'It requires infinite velocity exceeding light speed.',
        'It is a mathematical anomaly disproven by modern experiments.',
      ]
      const correctIdx = (index + lesson.title.length) % 4
      const shuffledOptions = [...options]
      const temp = shuffledOptions[0]
      shuffledOptions[0] = shuffledOptions[correctIdx]
      shuffledOptions[correctIdx] = temp

      deckSequence.push({
        type: 'quiz',
        lesson,
        question: `Pop Quiz: What is the core takeaway of "${lesson.title}"?`,
        options: shuffledOptions,
        correctIndex: correctIdx,
        explanation: lesson.takeaway,
      })
    }
  })

  const totalCards = deckSequence.length
  const isDeckFinished = activeCardIndex >= totalCards
  const currentItem = deckSequence[activeCardIndex] as DeckSequenceItem | undefined

  const currentLesson = currentItem?.lesson
  const isSaved = currentLesson
    ? savedLessons.some((saved) => saved.slug === currentLesson.slug)
    : false

  const handleNextCard = useCallback(() => {
    if (currentItem?.type === 'lesson' && currentItem.lesson) {
      onComplete(currentItem.lesson)
    }
    setIsFlipped(false)
    setSelectedQuizOption(null)
    setActiveCardIndex((prev) => Math.min(totalCards, prev + 1))
  }, [currentItem, onComplete, totalCards])

  const handlePrevCard = useCallback(() => {
    setIsFlipped(false)
    setSelectedQuizOption(null)
    setActiveCardIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const handleRestartDeck = () => {
    setIsFlipped(false)
    setSelectedQuizOption(null)
    setQuizScore(0)
    setActiveCardIndex(0)
  }

  const handleSelectQuizOption = (optionIndex: number, correctIndex: number, difficulty?: string) => {
    if (selectedQuizOption !== null) return
    setSelectedQuizOption(optionIndex)
    if (optionIndex === correctIndex) {
      const earnedXp = getQuizXp(difficulty)
      setQuizScore((prev) => prev + earnedXp)
    }
  }

  // Arrow key navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextCard()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevCard()
      } else if (e.key === 'f' || e.key === 'F') {
        if (currentItem?.type === 'lesson') setIsFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNextCard, handlePrevCard, currentItem])

  const progressPct = Math.round((Math.min(activeCardIndex, totalCards) / totalCards) * 100)

  return (
    <div className="card-deck-wrapper">
      {/* Deck Header & Progress */}
      <div className="deck-header-bar">
        <div className="deck-title-area">
          <span className="deck-icon">{deck.icon}</span>
          <div>
            <span className="deck-category-tag">{deck.category}</span>
            <h3 className="deck-title-text">{deck.title}</h3>
          </div>
        </div>

        <div className="deck-progress-box">
          <div className="deck-counter-text">
            {isDeckFinished ? '🎉 Complete' : `${activeCardIndex + 1} / ${totalCards}`}
          </div>
          <div className="deck-progress-track">
            <div className="deck-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Main reel row: [Prev/Next] | [9:16 Card] | [Quiz/Flip/Save] ── */}
      <div className="deck-reel-row">

        {/* LEFT STRIP — Prev / Next */}
        <div className="deck-left-strip">
          <button
            type="button"
            className="deck-strip-btn nav-btn"
            disabled={activeCardIndex === 0}
            onClick={handlePrevCard}
            title="Previous card  (↑ / ←)"
          >
            <span className="strip-icon">▲</span>
            <span className="strip-label">Prev</span>
          </button>

          <button
            type="button"
            className="deck-strip-btn nav-btn primary-next"
            onClick={handleNextCard}
            title="Next card  (↓ / →)"
          >
            <span className="strip-icon">▼</span>
            <span className="strip-label">Next</span>
          </button>
        </div>

        {/* CENTER — 9:16 Card */}
        <div className="deck-reel-card-wrap">
          {isDeckFinished ? (
            <div className="deck-completion-card animate-pop">
              <div className="completion-icon">🏆</div>
              <h2>Deck Mastered!</h2>
              <p>
                You completed all {totalCards} cards &amp; quizzes in{' '}
                <strong>{deck.title}</strong>.
              </p>
              <div className="completion-rewards">
                <span className="reward-badge">+{50 + quizScore} XP</span>
                <span className="reward-badge">🔥 Streak Intact</span>
              </div>

              <div className="completion-actions">
                <button type="button" className="deck-btn secondary" onClick={handleRestartDeck}>
                  🔄 Restack
                </button>
                {onSelectNextDeck && (
                  <button type="button" className="deck-btn primary" onClick={onSelectNextDeck}>
                    🚀 Next Deck ▶
                  </button>
                )}
              </div>
            </div>
          ) : (
            currentItem && (
              <div className="deck-stack">
                {/* Shadow cards */}
                {activeCardIndex + 2 < totalCards && (
                  <div className="stack-card stack-card-back-2" aria-hidden="true">
                    <div className="card-mini-preview">
                      <span className="mini-icon">
                        {deckSequence[activeCardIndex + 2].type === 'quiz'
                          ? '🧠'
                          : deckSequence[activeCardIndex + 2].lesson.visualKey}
                      </span>
                    </div>
                  </div>
                )}

                {activeCardIndex + 1 < totalCards && (
                  <div className="stack-card stack-card-back-1" aria-hidden="true">
                    <div className="card-mini-preview">
                      <span className="mini-icon">
                        {deckSequence[activeCardIndex + 1].type === 'quiz'
                          ? '🧠'
                          : deckSequence[activeCardIndex + 1].lesson.visualKey}
                      </span>
                    </div>
                  </div>
                )}

                {/* Active card */}
                {currentItem.type === 'quiz' ? (
                  /* QUIZ CARD */
                  <div className="stack-card stack-card-active quiz-card-stack">
                    <div className="card-face quiz-card-inner card-scrollable-body">
                      <div className="card-top-meta">
                        <span className="quiz-pill-badge">🧠 POP QUIZ</span>
                        <span className="xp-bonus-tag">+{getQuizXp(currentItem.lesson.difficulty)} XP</span>
                      </div>

                      <div className="quiz-card-body">
                        <p className="quiz-lesson-ref">
                          Testing: <strong>{currentItem.lesson.title}</strong>
                        </p>
                        <h2 className="quiz-question-title">{currentItem.question}</h2>

                        <div className="quiz-deck-options">
                          {currentItem.options.map((opt, idx) => {
                            const isSelected = selectedQuizOption === idx
                            const isCorrect = idx === currentItem.correctIndex
                            let optionClass = 'quiz-deck-opt-btn'

                            if (selectedQuizOption !== null) {
                              if (isCorrect) optionClass += ' correct'
                              else if (isSelected) optionClass += ' incorrect'
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                className={optionClass}
                                disabled={selectedQuizOption !== null}
                                onClick={() =>
                                  handleSelectQuizOption(
                                    idx,
                                    currentItem.correctIndex,
                                    currentItem.lesson.difficulty
                                  )
                                }
                              >
                                <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                                <span className="opt-text">{opt}</span>
                              </button>
                            )
                          })}
                        </div>

                        {selectedQuizOption !== null && (
                          <div
                            className={`quiz-feedback-banner ${
                              selectedQuizOption === currentItem.correctIndex ? 'success' : 'wrong'
                            }`}
                          >
                            {selectedQuizOption === currentItem.correctIndex ? (
                              <p>✓ <strong>Spot on!</strong> +{getQuizXp(currentItem.lesson.difficulty)} XP. {currentItem.explanation}</p>
                            ) : (
                              <p>✕ <strong>Not quite.</strong> {currentItem.explanation}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="quiz-card-footer">
                        <button
                          type="button"
                          className="deck-action-btn primary"
                          onClick={handleNextCard}
                        >
                          {selectedQuizOption !== null ? 'Continue ▶' : 'Skip Quiz ▶'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* LESSON CARD */
                  <div
                    className={`stack-card stack-card-active ${isFlipped ? 'flipped' : ''}`}
                    style={{ background: deck.gradient }}
                  >
                    <div className="card-inner">
                      {/* Front */}
                      <div className="card-face card-front card-scrollable-body">
                        <div className="card-top-meta">
                          <span className="card-difficulty-badge">
                            {currentLesson?.difficulty}
                          </span>
                          <span className="card-topic-tag">
                            {currentLesson?.topic || currentLesson?.category}
                          </span>
                        </div>

                        <div className="card-visual-center">
                          <div className="card-visual-circle">
                            <span className="visual-emoji">{currentLesson?.visualKey}</span>
                          </div>
                        </div>

                        <div className="card-main-content">
                          <h2 className="card-title">{currentLesson?.title}</h2>
                          <p className="card-explanation">{currentLesson?.explanation}</p>
                        </div>

                        <div className="card-bottom-hint">
                          <span>Press F or tap Flip to see the takeaway 💡</span>
                        </div>
                      </div>

                      {/* Back */}
                      <div className="card-face card-back card-scrollable-body">
                        <div className="card-top-meta">
                          <span className="card-difficulty-badge">Key Takeaway</span>
                        </div>

                        <div className="card-back-body">
                          <div className="takeaway-highlight-box">
                            <div className="takeaway-icon">💡</div>
                            <p className="takeaway-text">{currentLesson?.takeaway}</p>
                          </div>

                          <div className="card-related-topics">
                            <span className="related-label">Related Concepts:</span>
                            <div className="related-chips">
                              {(currentLesson?.relatedTopics && currentLesson.relatedTopics.length > 0
                                ? currentLesson.relatedTopics
                                : [currentLesson?.category, currentLesson?.difficulty]
                              ).map((rel, idx) => (
                                <span key={idx} className="rel-chip">#{rel}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* RIGHT STRIP — Quiz / Flip / Save */}
        {!isDeckFinished && currentItem && (
          <div className="deck-right-strip">
            {currentLesson && (
              <button
                type="button"
                className="deck-strip-btn quiz-strip-btn"
                onClick={() => onOpenQuiz(currentLesson)}
                title="Open Quiz"
              >
                <span className="strip-icon">🧠</span>
                <span className="strip-label">Quiz</span>
              </button>
            )}

            {currentItem.type === 'lesson' && (
              <button
                type="button"
                className="deck-strip-btn flip-strip-btn"
                onClick={() => setIsFlipped((f) => !f)}
                title="Flip card  (F)"
              >
                <span className="strip-icon">🔄</span>
                <span className="strip-label">Flip</span>
              </button>
            )}

            {currentItem.type === 'lesson' && currentLesson && (
              <button
                type="button"
                className={`deck-strip-btn save-strip-btn ${isSaved ? 'active' : ''}`}
                onClick={() => onToggleSave(currentLesson)}
                title={isSaved ? 'Saved' : 'Save'}
              >
                <span className="strip-icon">{isSaved ? '🔖' : '🏷️'}</span>
                <span className="strip-label">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

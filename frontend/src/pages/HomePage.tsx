import { useState, useEffect } from 'react'
import { ReelCard, type HomeLesson } from '../components/ReelCard'

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
  const [lessonIndex, setLessonIndex] = useState(0)

  useEffect(() => {
    setLessonIndex(0)
  }, [lessons])

  const reelLessons = lessons.slice(0, 30)

  // Interleave quizzes after every 3 reels
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
    if (e.key === 'ArrowDown' || e.key === 'j') {
      setLessonIndex((idx) => Math.min(reelSequence.length - 1, idx + 1))
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      setLessonIndex((idx) => Math.max(0, idx - 1))
    }
  }

  return (
    <div className="reels-feed-container" tabIndex={0} onKeyDown={handleKeyDown}>
      {currentItem ? (
        <div className="single-reel-viewport">
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
        </div>
      ) : (
        <div className="empty-state">
          <p>No educational reels found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}

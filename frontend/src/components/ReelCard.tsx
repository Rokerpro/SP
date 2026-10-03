export type HomeLesson = {
  slug: string
  category: string
  title: string
  topic: string
  explanation: string
  takeaway: string
  difficulty: string
  visualKey: string
  relatedTopics: string[]
  mediaType?: 'text' | 'video'
  videoUrl?: string
  status?: 'approved' | 'pending' | 'rejected'
  authorName?: string
}

type ReelCardProps = {
  lesson: HomeLesson
  isSaved?: boolean
  isCompleted?: boolean
  onToggleSave?: (lesson: HomeLesson) => void
  onComplete?: (lesson: HomeLesson) => void
  onOpenQuiz?: (lesson: HomeLesson) => void
}

export function ReelCard({
  lesson,
  isSaved = false,
  isCompleted = false,
  onToggleSave,
  onComplete,
  onOpenQuiz,
}: ReelCardProps) {
  return (
    <div className="reel-card-layout-wrapper">
      <article className="reel-card-main">
        {lesson.mediaType === 'video' && lesson.videoUrl ? (
          <div className="reel-media-wrapper">
            <video
              src={lesson.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="reel-video-element"
            />
            <div className="reel-media-overlay">
              <div className="reel-badge-row">
                <span className="category-pill">{lesson.category}</span>
                <span className="difficulty-pill">{lesson.difficulty}</span>
                {lesson.authorName && <span className="author-pill">By {lesson.authorName}</span>}
              </div>
              <h2 className="reel-title">{lesson.title}</h2>
              <p className="reel-explanation">{lesson.explanation}</p>
              <div className="reel-takeaway-box">
                <strong>💡 Takeaway:</strong> {lesson.takeaway}
              </div>
            </div>
          </div>
        ) : (
          <div className="reel-text-wrapper card-scrollable-body">
            <div className="reel-visual-header">
              <span className="reel-visual-icon">{lesson.visualKey}</span>
              <span className="reel-format-badge">Text Reel</span>
            </div>
            <div className="reel-text-body">
              <div className="reel-badge-row">
                <span className="category-pill">{lesson.category}</span>
                <span className="difficulty-pill">{lesson.difficulty}</span>
                {lesson.authorName && <span className="author-pill">By {lesson.authorName}</span>}
              </div>
              <h2 className="reel-title">{lesson.title}</h2>
              <p className="reel-explanation">{lesson.explanation}</p>
              <div className="reel-takeaway-box">
                <strong>💡 Key Takeaway:</strong> {lesson.takeaway}
              </div>
            </div>
          </div>
        )}
      </article>

      {/* RIGHT SIDE VERTICAL ACTION RAIL FOR REEL */}
      <aside className="deck-right-action-rail" aria-label="Reel Actions">
        {onOpenQuiz && (
          <button
            type="button"
            className="rail-action-btn quiz-rail-btn"
            onClick={() => onOpenQuiz(lesson)}
            title="Test Quiz"
          >
            <span className="rail-icon">🧠</span>
            <span className="rail-label">Quiz</span>
          </button>
        )}

        {onToggleSave && (
          <button
            type="button"
            className={`rail-action-btn save-rail-btn ${isSaved ? 'active' : ''}`}
            onClick={() => onToggleSave(lesson)}
            title={isSaved ? 'Saved' : 'Bookmark'}
          >
            <span className="rail-icon">{isSaved ? '🔖' : '🏷️'}</span>
            <span className="rail-label">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        )}

        {onComplete && (
          <button
            type="button"
            className={`rail-action-btn learn-rail-btn ${isCompleted ? 'completed' : ''}`}
            onClick={() => onComplete(lesson)}
            title={isCompleted ? 'Learned' : 'Mark Learned'}
          >
            <span className="rail-icon">{isCompleted ? '✓' : '⚡'}</span>
            <span className="rail-label">{isCompleted ? 'Learnt' : 'Learn'}</span>
          </button>
        )}
      </aside>
    </div>
  )
}

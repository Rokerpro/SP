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
        <div className="reel-text-wrapper">
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

      <div className="reel-card-actions">
        {onToggleSave && (
          <button
            type="button"
            className={`reel-action-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave(lesson)}
          >
            {isSaved ? '🔖 Saved' : '🔖 Bookmark'}
          </button>
        )}
        {onComplete && (
          <button
            type="button"
            className={`reel-action-btn ${isCompleted ? 'completed' : ''}`}
            onClick={() => onComplete(lesson)}
          >
            {isCompleted ? '✓ Learnt' : 'Mark Learned'}
          </button>
        )}
        {onOpenQuiz && (
          <button
            type="button"
            className="reel-action-btn quiz-btn"
            onClick={() => onOpenQuiz(lesson)}
          >
            🧠 Test Quiz
          </button>
        )}
      </div>
    </article>
  )
}

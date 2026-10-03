import { ReelCard, type HomeLesson } from '../components/ReelCard'

type SavedPageProps = {
  savedLessons: HomeLesson[]
  onToggleSaved: (lesson: HomeLesson) => void
  onCompleteLesson: (lesson: HomeLesson) => void
  onOpenQuiz: (lesson: HomeLesson) => void
}

export function SavedPage({
  savedLessons,
  onToggleSaved,
  onCompleteLesson,
  onOpenQuiz,
}: SavedPageProps) {
  return (
    <div className="saved-page-container">
      <header className="page-header">
        <span className="eyebrow">BOOKMARKS</span>
        <h1>Saved Reels ({savedLessons.length})</h1>
        <p>Review the educational reels you saved for future learning.</p>
      </header>

      <div className="reels-grid">
        {savedLessons.map((lesson) => (
          <ReelCard
            key={lesson.slug}
            lesson={lesson}
            isSaved={true}
            onToggleSave={onToggleSaved}
            onComplete={onCompleteLesson}
            onOpenQuiz={onOpenQuiz}
          />
        ))}
        {savedLessons.length === 0 && (
          <div className="empty-state">
            <p>You haven't saved any reels yet. Click the 🔖 Bookmark button on any reel to save it here!</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { DynamicIcon } from './DynamicIcon'

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
  isMuted?: boolean
  onMuteChange?: (muted: boolean) => void
}

export function ReelCard({
  lesson,
  isSaved = false,
  isCompleted = false,
  onToggleSave,
  onComplete,
  onOpenQuiz,
  isMuted: sharedMuted,
  onMuteChange,
}: ReelCardProps) {
  const [localMuted, setLocalMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const isMuted = sharedMuted ?? localMuted
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = isMuted
    if (isPlaying) void video.play().catch(() => setIsPlaying(false))
    else video.pause()
  }, [isMuted, isPlaying, lesson.videoUrl])

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted
      videoRef.current.muted = nextMuted
      setLocalMuted(nextMuted)
      onMuteChange?.(nextMuted)
    }
  }

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className="reel-card-layout-wrapper">
      <article className="reel-card-main">
        {lesson.mediaType === 'video' && lesson.videoUrl ? (
          <div className="reel-media-wrapper">
            <video
              ref={videoRef}
              src={lesson.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              controls={false}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="reel-video-element"
            />
            <button
              type="button"
              className="reel-play-toggle-btn"
              onClick={togglePlayback}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              title={isPlaying ? 'Pause video' : 'Play video'}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
            </button>
            <button
              type="button"
              className="reel-sound-toggle-btn"
              onClick={toggleSound}
              title={isMuted ? 'Click to unmute audio' : 'Click to mute audio'}
            >
              <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`} />
            </button>
            <div className="reel-media-overlay">
              <div className="reel-badge-row">
                <span className="category-pill">{lesson.category}</span>
                <span className="difficulty-pill">{lesson.difficulty}</span>
                {lesson.authorName && <span className="author-pill">By {lesson.authorName}</span>}
              </div>
              <h2 className="reel-title">{lesson.title}</h2>
              <p className="reel-explanation">{lesson.explanation}</p>
              <div className="reel-takeaway-box">
                <i className="fa-solid fa-lightbulb" style={{ color: '#eab308', marginRight: 6 }} />
                <strong>Takeaway:</strong> {lesson.takeaway}
              </div>
            </div>
          </div>
        ) : (
          <div className="reel-text-wrapper card-scrollable-body">
            <div className="reel-visual-header">
              <span className="reel-visual-icon"><DynamicIcon name={lesson.visualKey} /></span>
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
                <i className="fa-solid fa-lightbulb" style={{ color: '#eab308', marginRight: 6 }} />
                <strong>Key Takeaway:</strong> {lesson.takeaway}
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Right-side actions use the same controls as Volt Decks. */}
      <aside className="deck-right-strip" aria-label="Reel Actions">
        {onOpenQuiz && (
          <button
            type="button"
            className="deck-strip-btn quiz-strip-btn"
            onClick={() => onOpenQuiz(lesson)}
            title="Test Quiz"
          >
            <span className="strip-icon"><i className="fa-solid fa-brain" /></span>
            <span className="strip-label">Quiz</span>
          </button>
        )}

        {onToggleSave && (
          <button
            type="button"
            className={`deck-strip-btn save-strip-btn ${isSaved ? 'active' : ''}`}
            onClick={() => onToggleSave(lesson)}
            title={isSaved ? 'Saved' : 'Bookmark'}
          >
            <span className="strip-icon">
              <i className={isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'} />
            </span>
            <span className="strip-label">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        )}

        {onComplete && (
          <button
            type="button"
            className={`deck-strip-btn learn-strip-btn ${isCompleted ? 'completed' : ''}`}
            onClick={() => onComplete(lesson)}
            title={isCompleted ? 'Learned' : 'Mark Learned'}
          >
            <span className="strip-icon">
              <i className={isCompleted ? 'fa-solid fa-check' : 'fa-solid fa-bolt'} />
            </span>
            <span className="strip-label">{isCompleted ? 'Learnt' : 'Learn'}</span>
          </button>
        )}
      </aside>
    </div>
  )
}

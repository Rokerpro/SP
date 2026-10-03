import { useState, type FormEvent } from 'react'

type CreateReelModalProps = {
  onClose: () => void
  onSubmit: (postData: {
    title: string
    topic: string
    category: string
    explanation: string
    takeaway: string
    difficulty: string
    mediaType: 'text' | 'video'
    videoUrl: string
  }) => Promise<void>
}

export function CreateReelModal({ onClose, onSubmit }: CreateReelModalProps) {
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('Science')
  const [explanation, setExplanation] = useState('')
  const [takeaway, setTakeaway] = useState('')
  const [difficulty, setDifficulty] = useState('Beginner')
  const [mediaType, setMediaType] = useState<'text' | 'video'>('text')
  const [videoUrl, setVideoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title || !explanation || !takeaway) {
      setError('Please fill in title, explanation, and key takeaway')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit({
        title,
        topic: topic || title,
        category,
        explanation,
        takeaway,
        difficulty,
        mediaType,
        videoUrl: mediaType === 'video' ? videoUrl : '',
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit reel')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card create-reel-modal">
        <button className="modal-close-btn" type="button" onClick={onClose}>
          ✕
        </button>
        <span className="modal-eyebrow">COMMUNITY REELS</span>
        <h2>Create Educational Reel</h2>

        <form onSubmit={handleSubmit} className="create-reel-form">
          <label htmlFor="post-title">TITLE</label>
          <input
            className="standalone-input"
            id="post-title"
            type="text"
            placeholder="e.g. How Quantum Computing Works"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="post-topic">TOPIC / KEYWORD</label>
          <input
            className="standalone-input"
            id="post-topic"
            type="text"
            placeholder="e.g. Qubits"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="form-row">
            <div>
              <label htmlFor="post-category">CATEGORY</label>
              <select
                className="standalone-input grade-select"
                id="post-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {['Science', 'Space', 'Technology', 'Mathematics', 'Psychology', 'History', 'Environment', 'Literature', 'Economics'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="post-difficulty">DIFFICULTY</label>
              <select
                className="standalone-input grade-select"
                id="post-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <label htmlFor="post-media-type">CONTENT FORMAT</label>
          <select
            className="standalone-input grade-select"
            id="post-media-type"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as 'text' | 'video')}
          >
            <option value="text">Text & Visual Card</option>
            <option value="video">Short Video Reel</option>
          </select>

          {mediaType === 'video' && (
            <>
              <label htmlFor="post-video-url">VIDEO URL (MP4 / WebM)</label>
              <input
                className="standalone-input"
                id="post-video-url"
                type="url"
                placeholder="https://example.com/video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="post-explanation">EXPLANATION</label>
          <textarea
            className="standalone-input text-area"
            id="post-explanation"
            rows={3}
            placeholder="Explain the key concept in simple words..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            required
          />

          <label htmlFor="post-takeaway">KEY TAKEAWAY</label>
          <input
            className="standalone-input"
            id="post-takeaway"
            type="text"
            placeholder="One main takeaway to remember..."
            value={takeaway}
            onChange={(e) => setTakeaway(e.target.value)}
            required
          />

          {error && <p className="form-message">{error}</p>}

          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}
          </button>
        </form>
      </div>
    </div>
  )
}

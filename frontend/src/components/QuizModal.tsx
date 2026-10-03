type QuizData = {
  lessonSlug: string
  question: string
  options: string[]
}

type QuizModalProps = {
  quiz: QuizData
  onClose: () => void
  onAnswer: (optionIndex: number) => void
}

export function QuizModal({ quiz, onClose, onAnswer }: QuizModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card quiz-modal-card">
        <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Close Quiz">
          ✕
        </button>
        <span className="modal-eyebrow">QUICK CONCEPT CHECK</span>
        <h2 className="quiz-question-text">{quiz.question}</h2>
        <div className="quiz-options-list">
          {quiz.options.map((option, index) => (
            <button
              className="quiz-option-btn"
              type="button"
              key={option}
              onClick={() => onAnswer(index)}
            >
              <span className="option-index">{String.fromCharCode(65 + index)}.</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

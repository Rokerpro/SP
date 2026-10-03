import { useEffect, useState, type FormEvent } from 'react'
import { BoltLogo } from './BoltLogo'

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
}

export type HomeProgressStats = {
  conceptsLearned: number
  quizAccuracy: number
  savedLessons: number
  streak: number
  categoryProgress: Record<string, { completed: number; total: number }>
}

export type HomeView = 'home' | 'discover' | 'saved' | 'progress'

type Quiz = { lessonSlug: string; question: string; options: string[] }

type HomePageProps = {
  displayName: string
  activeView: HomeView
  lessons: HomeLesson[]
  savedLessons: HomeLesson[]
  progressStats: HomeProgressStats
  categories: string[]
  searchQuery: string
  quiz: Quiz | null
  quizFeedback: string
  tutorPrompt: string
  tutorAnswer: string
  onViewChange: (view: HomeView) => void
  onLogout: () => void
  onSearchQueryChange: (query: string) => void
  onSearch: (event: FormEvent<HTMLFormElement>) => void
  onCategorySelect: (category: string) => void
  onLessonSelect: (lesson: HomeLesson) => void
  onCompleteLesson: (lesson: HomeLesson) => void
  onToggleSaved: (lesson: HomeLesson) => void
  onOpenQuiz: (lesson: HomeLesson) => void
  onCloseQuiz: () => void
  onAnswerQuiz: (answer: number) => void
  onQuizFeedbackDismiss: () => void
  onTutorPromptChange: (prompt: string) => void
  onAskTutor: (event: FormEvent<HTMLFormElement>) => void
}

export function HomePage({
  displayName,
  activeView,
  lessons,
  savedLessons,
  progressStats,
  categories,
  searchQuery,
  quiz,
  quizFeedback,
  tutorPrompt,
  tutorAnswer,
  onViewChange,
  onLogout,
  onSearchQueryChange,
  onSearch,
  onCategorySelect,
  onLessonSelect,
  onCompleteLesson,
  onToggleSaved,
  onOpenQuiz,
  onCloseQuiz,
  onAnswerQuiz,
  onQuizFeedbackDismiss,
  onTutorPromptChange,
  onAskTutor,
}: HomePageProps) {
  const [lessonIndex, setLessonIndex] = useState(0)
  const reelLessons = lessons.slice(0, 15)

  useEffect(() => {
    setLessonIndex(0)
  }, [lessons])

  const currentLesson = reelLessons[lessonIndex]

  useEffect(() => {
    if (activeView !== 'home') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') setLessonIndex((index) => Math.max(0, index - 1))
      if (event.key === 'ArrowDown') setLessonIndex((index) => Math.min(reelLessons.length - 1, index + 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeView, reelLessons.length])

  return (
    <main className={`app-shell${activeView === 'home' ? ' reels-page' : ''}`}>
      {activeView !== 'home' && <nav className="app-nav">
        <div className="app-brand"><BoltLogo /></div>
        <div className="nav-links" aria-label="Main navigation">
          {([['home', 'Learn'], ['discover', 'Discover'], ['saved', 'Saved'], ['progress', 'Progress']] as const).map(([view, label]) => <button className={activeView === view ? 'active' : ''} key={view} type="button" onClick={() => onViewChange(view)}>{label}</button>)}
        </div>
        <button className="profile-button" type="button" onClick={onLogout}>{displayName}</button>
      </nav>}
        <section className={`app-content${activeView === 'home' ? ' reels-content' : ''}`}>
        {activeView === 'home' && <>
          <header className="reels-heading"><p className="eyebrow">YOUR DAILY BOLT</p><h1>One idea at a time.</h1><p>Scroll to keep learning.</p></header>
          {currentLesson ? <div className="lesson-feed reels-feed"><article className="lesson-card reel-card" key={currentLesson.slug}><div className="reel-visual"><span className="reel-visual-label">{currentLesson.visualKey}</span><span className="reel-play" aria-hidden="true">▶</span><div className="reel-overlay"><div className="lesson-meta"><span>{currentLesson.category}</span><span>{currentLesson.difficulty}</span></div><h2>{currentLesson.title}</h2><p>{currentLesson.explanation}</p><strong>{currentLesson.takeaway}</strong></div></div><div className="reel-actions"><button type="button" onClick={() => onCompleteLesson(currentLesson)} aria-label="Mark lesson learned"><span>♥</span><small>Learn</small></button><button type="button" onClick={() => onToggleSaved(currentLesson)} aria-label={savedLessons.some((item) => item.slug === currentLesson.slug) ? 'Remove saved lesson' : 'Save lesson'}><span>{savedLessons.some((item) => item.slug === currentLesson.slug) ? '◆' : '◇'}</span><small>{savedLessons.some((item) => item.slug === currentLesson.slug) ? 'Saved' : 'Save'}</small></button><button type="button" onClick={() => onOpenQuiz(currentLesson)} aria-label="Open lesson quiz"><span>?</span><small>Quiz</small></button></div></article></div> : <p className="empty-state">No lessons available.</p>}
          <div className="reel-stepper" aria-label="Lesson navigation"><button type="button" aria-label="Previous lesson" disabled={lessonIndex === 0} onClick={() => setLessonIndex((index) => Math.max(0, index - 1))}>⌃</button><span>{reelLessons.length ? `${lessonIndex + 1} / ${reelLessons.length}` : '0 / 0'}</span><button type="button" aria-label="Next lesson" disabled={lessonIndex >= reelLessons.length - 1} onClick={() => setLessonIndex((index) => Math.min(reelLessons.length - 1, index + 1))}>⌄</button></div>
          {lessonIndex >= reelLessons.length - 1 && reelLessons.length > 0 && <p className="reel-ending">Your daily dose of education ends here.</p>}
        </>}
        {activeView === 'discover' && <><header className="page-heading"><p className="eyebrow">DISCOVER</p><h1>Find your next idea.</h1></header><form className="search-form" onSubmit={onSearch}><input value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Search lessons, topics, categories" /><button type="submit">Search</button></form><div className="category-list">{categories.map((category) => <button type="button" key={category} onClick={() => onCategorySelect(category)}>{category}</button>)}</div><div className="discover-list">{lessons.map((lesson) => <button type="button" key={lesson.slug} onClick={() => onLessonSelect(lesson)}><span>{lesson.category}</span><strong>{lesson.title}</strong><small>{lesson.topic}</small></button>)}</div></>}
        {activeView === 'saved' && <><header className="page-heading"><p className="eyebrow">SAVED</p><h1>Ideas worth returning to.</h1></header><div className="saved-list">{savedLessons.length ? savedLessons.map((lesson) => <article key={lesson.slug}><span>{lesson.category}</span><h2>{lesson.title}</h2><button type="button" onClick={() => onToggleSaved(lesson)}>Remove</button></article>) : <p className="empty-state">Nothing saved yet.</p>}</div></>}
        {activeView === 'progress' && <><header className="page-heading"><p className="eyebrow">PROGRESS</p><h1>Your learning pulse.</h1></header><div className="stats-grid"><div><strong>{progressStats.conceptsLearned}</strong><span>concepts learned</span></div><div><strong>{progressStats.quizAccuracy}%</strong><span>quiz accuracy</span></div><div><strong>{progressStats.streak} days</strong><span>learning streak</span></div></div><div className="category-progress">{Object.entries(progressStats.categoryProgress).map(([category, value]) => <div key={category}><span>{category}</span><strong>{value.completed}/{value.total}</strong><i><b style={{ width: `${value.total ? (value.completed / value.total) * 100 : 0}%` }} /></i></div>)}</div><section className="tutor-panel"><p className="eyebrow">BOLT TUTOR</p><h2>Ask about your current lesson.</h2><form onSubmit={onAskTutor}><input value={tutorPrompt} onChange={(event) => onTutorPromptChange(event.target.value)} placeholder="Explain this simply..." required /><button type="submit">Ask</button></form>{tutorAnswer && <p>{tutorAnswer}</p>}</section></>}
      </section>
      {quiz && <div className="quiz-modal"><div><button className="modal-close" type="button" onClick={onCloseQuiz}>Close</button><p className="eyebrow">QUICK CHECK</p><h2>{quiz.question}</h2>{quiz.options.map((option, index) => <button className="quiz-option" type="button" key={option} onClick={() => onAnswerQuiz(index)}>{option}</button>)}</div></div>}
      {quizFeedback && <button className="feedback-toast" type="button" onClick={onQuizFeedbackDismiss}>{quizFeedback}</button>}
    </main>
  )
}

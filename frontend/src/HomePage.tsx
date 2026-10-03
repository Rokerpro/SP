import type { FormEvent } from 'react'

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
  return (
    <main className="app-shell">
      <nav className="app-nav">
        <div className="app-brand"><span className="bolt-icon">✦</span> BOLT</div>
        <div className="nav-links">
          {([['home', 'Learn'], ['discover', 'Discover'], ['saved', 'Saved'], ['progress', 'Progress']] as const).map(([view, label]) => <button className={activeView === view ? 'active' : ''} key={view} type="button" onClick={() => onViewChange(view)}>{label}</button>)}
        </div>
        <button className="profile-button" type="button" onClick={onLogout}>{displayName}</button>
      </nav>
      <section className="app-content">
        {activeView === 'home' && <>
          <header className="page-heading"><p className="eyebrow">YOUR DAILY BOLT</p><h1>Keep your curiosity moving.</h1><p>Short lessons, sharp ideas, better recall.</p></header>
          <div className="lesson-feed">{lessons.map((lesson) => <article className="lesson-card" key={lesson.slug}><div className="lesson-visual"><span>{lesson.visualKey}</span></div><div className="lesson-body"><div className="lesson-meta"><span>{lesson.category}</span><span>{lesson.difficulty}</span></div><h2>{lesson.title}</h2><p>{lesson.explanation}</p><strong>{lesson.takeaway}</strong><div className="lesson-actions"><button type="button" onClick={() => onCompleteLesson(lesson)}>Mark learned</button><button type="button" onClick={() => onToggleSaved(lesson)}>{savedLessons.some((item) => item.slug === lesson.slug) ? 'Saved' : 'Save'}</button><button type="button" onClick={() => onOpenQuiz(lesson)}>Quiz</button></div></div></article>)}</div>
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

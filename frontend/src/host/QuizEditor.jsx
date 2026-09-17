import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addQuestion, ApiError, getQuiz, startQuiz } from '../api/client'
import { useAuth } from '../auth/useAuth'

const emptyQuestion = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: '',
}

function validateQuestion(question) {
  const errors = {}
  if (!question.question_text.trim()) errors.question_text = 'Question text is required.'
  for (const option of ['option_a', 'option_b', 'option_c', 'option_d']) {
    if (!question[option].trim()) errors[option] = 'This option is required.'
  }
  if (!question.correct_option) errors.correct_option = 'Select the correct option.'
  return errors
}

export function QuizEditor() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [quiz, setQuiz] = useState(null)
  const [question, setQuestion] = useState(emptyQuestion)
  const [errors, setErrors] = useState({})
  const [pageError, setPageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    async function loadQuiz() {
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        const result = await getQuiz(quizId, token)
        setQuiz(result.quiz)
      } catch (requestError) {
        setPageError(requestError instanceof ApiError ? requestError.message : 'Unable to load this quiz.')
      } finally {
        setIsLoading(false)
      }
    }
    loadQuiz()
  }, [quizId, token])

  function updateQuestion(event) {
    const { name, value } = event.target
    setQuestion((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setPageError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateQuestion(question)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !token) return

    setIsSubmitting(true)
    try {
      const result = await addQuestion(quizId, question, token)
      setQuiz((current) => ({ ...current, questions: [...current.questions, result.question] }))
      setQuestion(emptyQuestion)
    } catch (requestError) {
      setPageError(requestError instanceof ApiError ? requestError.message : 'Unable to add this question.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStartQuiz() {
    console.log(`[QuizEditor] Start Quiz clicked; questions: ${questions.length}`)
    if (!token || questions.length === 0) return

    setPageError('')
    setIsStarting(true)
    try {
      await startQuiz(quizId, token)
      navigate(`/host/quiz/${quizId}/live`)
    } catch (requestError) {
      console.error('[QuizEditor] Start Quiz request failed:', requestError)
      setPageError(requestError instanceof ApiError ? requestError.message : 'Unable to start this quiz.')
    } finally {
      setIsStarting(false)
    }
  }

  if (!token) {
    return <main className="page-shell host-page"><p className="form-error">Log in to manage this quiz.</p><Link className="text-link" to="/login">Log in</Link></main>
  }

  if (isLoading) return <main className="page-shell host-page"><p className="host-muted">Loading quiz...</p></main>
  if (!quiz) return <main className="page-shell host-page"><p className="form-error" role="alert">{pageError || 'Quiz not found.'}</p></main>

  const questions = quiz.questions ?? []
  console.log(`[QuizEditor] Current question count before Start Quiz disabled check: ${questions.length}`)
  return (
    <main className="page-shell host-page quiz-editor">
      <div className="editor-heading">
        <div>
          <p className="eyebrow">Quiz editor</p>
          <h1>{quiz.title}</h1>
        </div>
        <div className="room-code-block" aria-label={`Room code ${quiz.room_code}`}>
          <span className="room-code-label">Room code</span>
          <strong>{quiz.room_code}</strong>
        </div>
      </div>
      <div className="editor-grid">
        <section className="host-section" aria-labelledby="questions-title">
          <div className="section-heading">
            <h2 id="questions-title">Questions</h2>
            <span>{questions.length}</span>
          </div>
          {questions.length === 0 ? (
            <p className="host-muted">No questions added yet.</p>
          ) : (
            <ol className="question-list">
              {questions.map((item, index) => (
                <li key={item.id}>
                  <strong>{index + 1}. {item.question_text}</strong>
                  <span>Correct answer: {item.correct_option}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="host-section" aria-labelledby="add-question-title">
          <h2 id="add-question-title">Add question</h2>
          {pageError && <p className="form-error" role="alert">{pageError}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="question_text">Question</label>
              <textarea id="question_text" name="question_text" value={question.question_text} onChange={updateQuestion} rows="3" aria-invalid={Boolean(errors.question_text)} />
              {errors.question_text && <p className="field-error">{errors.question_text}</p>}
            </div>
            <fieldset className="options-fieldset">
              <legend>Answer options</legend>
              {['a', 'b', 'c', 'd'].map((letter) => {
                const name = `option_${letter}`
                return (
                  <div className="option-row" key={name}>
                    <label htmlFor={name}>{letter.toUpperCase()}</label>
                    <input id={name} name={name} value={question[name]} onChange={updateQuestion} aria-invalid={Boolean(errors[name])} />
                    <input type="radio" name="correct_option" value={letter.toUpperCase()} checked={question.correct_option === letter.toUpperCase()} onChange={updateQuestion} aria-label={`Mark option ${letter.toUpperCase()} correct`} />
                  </div>
                )
              })}
              {errors.correct_option && <p className="field-error">{errors.correct_option}</p>}
            </fieldset>
            <button className="form-submit form-submit-inline" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add question'}
            </button>
          </form>
        </section>
      </div>
      <section className="start-quiz-section" aria-labelledby="start-quiz-title">
        <div>
          <h2 id="start-quiz-title">Ready to host?</h2>
          {questions.length === 0 && <p className="host-muted">Add at least one question first</p>}
          {pageError && <p className="form-error" role="alert">{pageError}</p>}
        </div>
        <button
          className="start-button"
          type="button"
          onClick={handleStartQuiz}
          disabled={questions.length === 0 || isStarting}
          title={questions.length === 0 ? 'Add at least one question first' : undefined}
        >
          {isStarting ? 'Starting...' : 'Start Quiz'}
        </button>
      </section>
    </main>
  )
}
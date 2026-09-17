import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, createQuiz } from '../api/client'
import { useAuth } from '../auth/useAuth'

export function HostDashboard() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateValue(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (values.title.trim().length < 3) {
      setError('Quiz title must be at least 3 characters.')
      return
    }

    if (!token) {
      setError('You must be logged in to create a quiz.')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      const result = await createQuiz(
        { title: values.title.trim(), description: values.description.trim() },
        token,
      )
      navigate(`/host/quiz/${result.quiz.id}`)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to reach the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <main className="page-shell host-page">
        <p className="eyebrow">Live quiz platform</p>
        <h1>Host dashboard</h1>
        <p className="host-muted">Log in to create and manage quizzes.</p>
        <Link className="text-link" to="/login">Log in</Link>
      </main>
    )
  }

  return (
    <main className="page-shell host-page">
      <p className="eyebrow">Live quiz platform</p>
      <h1>Host dashboard</h1>
      <p className="host-muted">Create a quiz, then add questions before you start the session.</p>
      <section className="host-section" aria-labelledby="create-quiz-title">
        <h2 id="create-quiz-title">Create new quiz</h2>
        {error && <p className="form-error" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="quiz-title">Title</label>
            <input id="quiz-title" name="title" value={values.title} onChange={updateValue} />
          </div>
          <div className="form-field">
            <label htmlFor="quiz-description">Description <span className="host-muted">(optional)</span></label>
            <textarea id="quiz-description" name="description" value={values.description} onChange={updateValue} rows="4" />
          </div>
          <button className="form-submit form-submit-inline" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create quiz'}
          </button>
        </form>
      </section>
      <p className="host-note">Quiz history will appear here once a list endpoint is available.</p>
      {/* TODO: Add a list-my-quizzes backend endpoint before showing existing quizzes here. */}
    </main>
  )
}
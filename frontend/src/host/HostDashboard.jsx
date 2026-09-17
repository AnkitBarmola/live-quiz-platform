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
      <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16">
        <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Live quiz platform</p>
        <h1>Host dashboard</h1>
        <p className="text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Log in to create and manage quizzes.</p>
        <Link className="mt-6 inline-block text-[15px] font-bold leading-[22px] text-ink" to="/login">Log in</Link>
      </main>
    )
  }

  return (
    <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16">
      <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Live quiz platform</p>
      <h1>Host dashboard</h1>
      <p className="text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Create a quiz, then add questions before you start the session.</p>
      <section className="mt-12 rounded-design border border-gray-3 bg-gray-1 p-6 shadow-panel sm:p-8" aria-labelledby="create-quiz-title">
        <h2 className="mb-6" id="create-quiz-title">Create new quiz</h2>
        {error && <p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mt-6 max-w-[640px]">
            <label className="mb-2 block text-[13px] font-bold leading-[18px]" htmlFor="quiz-title">Title</label>
            <input className="box-border min-h-8 w-full rounded-design border border-gray-4 bg-gray-1 px-4 py-2 text-[15px] leading-[22px] text-ink outline-2 outline-accent outline-offset-1 focus:border-gray-6" id="quiz-title" name="title" value={values.title} onChange={updateValue} />
          </div>
          <div className="mt-6 max-w-[640px]">
            <label className="mb-2 block text-[13px] font-bold leading-[18px]" htmlFor="quiz-description">Description <span className="text-gray-5">(optional)</span></label>
            <textarea className="box-border w-full resize-y rounded-design border border-gray-4 bg-gray-1 px-4 py-2 text-[15px] leading-[22px] text-ink outline-2 outline-accent outline-offset-1 focus:border-gray-6" id="quiz-description" name="description" value={values.description} onChange={updateValue} rows="4" />
          </div>
          <button className="mt-8 rounded-design border border-ink bg-accent px-6 py-2 text-[15px] font-bold leading-[22px] text-ink transition duration-150 ease-standard hover:-translate-y-px disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create quiz'}
          </button>
        </form>
      </section>
      <p className="mt-6 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Quiz history will appear here once a list endpoint is available.</p>
      {/* TODO: Add a list-my-quizzes backend endpoint before showing existing quizzes here. */}
    </main>
  )
}
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
    return <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16"><p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect">Log in to manage this quiz.</p><Link className="mt-6 inline-block text-[15px] font-bold leading-[22px] text-ink" to="/login">Log in</Link></main>
  }

  if (isLoading) return <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16"><p className="text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Loading quiz...</p></main>
  if (!quiz) return <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16"><p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{pageError || 'Quiz not found.'}</p></main>

  const questions = quiz.questions ?? []
  console.log(`[QuizEditor] Current question count before Start Quiz disabled check: ${questions.length}`)
  return (
    <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
        <div>
          <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Quiz editor</p>
          <h1>{quiz.title}</h1>
        </div>
        <div className="min-w-0 rounded-design bg-gray-6 p-6 text-center text-gray-1 sm:min-w-60" aria-label={`Room code ${quiz.room_code}`}>
          <span className="mb-2 block text-[13px] font-bold uppercase leading-[18px] text-gray-3">Room code</span>
          <strong className="block text-[34px] leading-10 tracking-[3px] text-accent">{quiz.room_code}</strong>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="mt-0 rounded-design border border-gray-3 bg-gray-1 p-6 shadow-panel sm:p-8" aria-labelledby="questions-title">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="questions-title">Questions</h2>
            <span className="text-[13px] leading-[18px] text-gray-5">{questions.length}</span>
          </div>
          {questions.length === 0 ? (
            <p className="text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">No questions added yet.</p>
          ) : (
            <ol className="m-0 grid gap-4 pl-6">
              {questions.map((item, index) => (
                <li key={item.id}>
                  <strong className="block text-[15px] leading-[22px]">{index + 1}. {item.question_text}</strong>
                  <span className="mt-2 block text-[13px] leading-[18px] text-gray-5">Correct answer: {item.correct_option}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="mt-0 rounded-design border border-gray-3 bg-gray-1 p-6 shadow-panel sm:p-8" aria-labelledby="add-question-title">
          <h2 id="add-question-title">Add question</h2>
          {pageError && <p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{pageError}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mt-6 max-w-[640px]">
              <label className="mb-2 block text-[13px] font-bold leading-[18px]" htmlFor="question_text">Question</label>
              <textarea className="box-border w-full resize-y rounded-design border border-gray-4 bg-gray-1 px-4 py-2 text-[15px] leading-[22px] text-ink outline-2 outline-accent outline-offset-1 focus:border-gray-6" id="question_text" name="question_text" value={question.question_text} onChange={updateQuestion} rows="3" aria-invalid={Boolean(errors.question_text)} />
              {errors.question_text && <p className="m-0 mt-2 text-[13px] leading-[18px] text-incorrect">{errors.question_text}</p>}
            </div>
            <fieldset className="mt-6 grid gap-4 border-0 p-0">
              <legend className="mb-2 text-[13px] font-bold leading-[18px]">Answer options</legend>
              {['a', 'b', 'c', 'd'].map((letter) => {
                const name = `option_${letter}`
                return (
                  <div className="grid grid-cols-[24px_1fr_16px] items-center gap-2" key={name}>
                    <label className="text-[13px] font-bold leading-[18px]" htmlFor={name}>{letter.toUpperCase()}</label>
                    <input className="box-border w-full rounded-design border border-gray-4 bg-gray-1 px-4 py-2 text-[15px] leading-[22px] text-ink outline-2 outline-accent outline-offset-1 focus:border-gray-6" id={name} name={name} value={question[name]} onChange={updateQuestion} aria-invalid={Boolean(errors[name])} />
                    <input className="accent-correct" type="radio" name="correct_option" value={letter.toUpperCase()} checked={question.correct_option === letter.toUpperCase()} onChange={updateQuestion} aria-label={`Mark option ${letter.toUpperCase()} correct`} />
                  </div>
                )
              })}
              {errors.correct_option && <p className="m-0 text-[13px] leading-[18px] text-incorrect">{errors.correct_option}</p>}
            </fieldset>
            <button className="mt-8 rounded-design border border-ink bg-accent px-6 py-2 text-[15px] font-bold leading-[22px] text-ink transition duration-150 ease-standard hover:-translate-y-px disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add question'}
            </button>
          </form>
        </section>
      </div>
      <section className="mt-12 flex flex-col items-stretch justify-between gap-8 rounded-design border border-ink bg-accent p-8 sm:flex-row sm:items-center" aria-labelledby="start-quiz-title">
        <div>
          <h2 id="start-quiz-title">Ready to host?</h2>
          {questions.length === 0 && <p className="text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Add at least one question first</p>}
          {pageError && <p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{pageError}</p>}
        </div>
        <button
          className="min-h-12 w-full min-w-45 rounded-design border border-ink bg-ink px-6 py-4 text-[17px] font-bold leading-6 text-gray-1 transition duration-150 ease-standard hover:-translate-y-px disabled:cursor-not-allowed disabled:border-gray-3 disabled:bg-gray-2 disabled:text-gray-5 disabled:opacity-80 sm:w-auto"
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
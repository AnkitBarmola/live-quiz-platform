import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getQuiz } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { useQuestionTimer } from '../live/useQuestionTimer'
import { useSocket } from '../socket/useSocket'

export function HostLivePage() {
  const { quizId } = useParams()
  const { token } = useAuth()
  const { socket, connectionState, error, dismissError, connectAsHost } = useSocket()
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [leaderboard, setLeaderboard] = useState([])
  const [answerCount, setAnswerCount] = useState(0)
  const [pageError, setPageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const secondsRemaining = useQuestionTimer(currentQuestion?.id)

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

  useEffect(() => {
    if (token) connectAsHost(token, quizId)
  }, [connectAsHost, quizId, token])

  useEffect(() => {
    if (!socket) return undefined

    function handleQuestionStarted(question) {
      console.log('question:started', question)
      setCurrentQuestion(question)
      setAnswerCount(0)
      setCurrentIndex((index) => {
        const nextIndex = quiz?.questions?.findIndex((item) => String(item.id) === String(question.id)) ?? -1
        return nextIndex >= 0 ? nextIndex : index
      })
    }

    function handleLeaderboardUpdate(nextLeaderboard) {
      setLeaderboard(nextLeaderboard)
      setAnswerCount((count) => count + 1)
    }

    socket.on('question:started', handleQuestionStarted)
    socket.on('leaderboard:update', handleLeaderboardUpdate)
    return () => {
      socket.off('question:started', handleQuestionStarted)
      socket.off('leaderboard:update', handleLeaderboardUpdate)
    }
  }, [quiz, socket])

  function startNextQuestion() {
    const nextIndex = currentIndex + 1
    const nextQuestion = quiz?.questions?.[nextIndex]
    if (!socket || !nextQuestion) return
    socket.emit('host:start-question', { quizId, questionId: nextQuestion.id })
  }

  if (!token) {
    return <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16"><p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect">Log in to run this quiz.</p><Link className="mt-6 inline-block text-[15px] font-bold leading-[22px] text-ink" to="/login">Log in</Link></main>
  }

  if (isLoading) return <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16"><p className="text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Loading live quiz...</p></main>
  if (!quiz) return <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16"><p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{pageError || 'Quiz not found.'}</p></main>

  const hasNextQuestion = currentIndex + 1 < quiz.questions.length
  return (
    <main className="box-border min-h-screen max-w-[1120px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col items-start justify-between gap-8 sm:flex-row">
        <div>
          <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Live quiz</p>
          <h1>{quiz.title}</h1>
        </div>
        <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center">
          <div className="rounded-design bg-gray-6 px-4 py-2 text-center text-gray-1" aria-label={`Room code ${quiz.room_code}`}>
            <span className="block text-[11px] font-bold uppercase leading-4 text-gray-3">Room code</span>
            <strong className="block text-[22px] leading-7 tracking-[2px] text-accent">{quiz.room_code}</strong>
          </div>
          <div className="flex items-center gap-2 text-[15px] leading-[22px] text-gray-5" data-state={connectionState}>
            <span className={`h-2 w-2 rounded-full ${connectionState === 'connected' ? 'bg-correct' : connectionState === 'error' ? 'bg-incorrect' : 'bg-gray-4'}`} />
            {connectionState === 'connected' ? 'Connected' : connectionState === 'error' ? 'Connection issue' : 'Connecting'}
          </div>
        </div>
      </header>
      {error && (
        <div className="mt-8 flex items-center justify-between gap-4 rounded-design border border-incorrect p-4 text-left text-[13px] leading-[18px] text-incorrect" role="alert">
          <span>{error}</span>
          <button className="shrink-0 border-0 bg-transparent p-2 font-bold text-inherit" type="button" onClick={dismissError}>Dismiss</button>
        </div>
      )}
      {pageError && <p className="mt-8 rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{pageError}</p>}
      <section className="mt-12 rounded-design border border-gray-3 bg-gray-1 p-6 shadow-panel sm:p-8" aria-live="polite">
        <div className="flex items-center justify-between gap-4 text-[15px] leading-[22px] text-gray-5">
          <span>{currentQuestion ? `Question ${currentIndex + 1} of ${quiz.questions.length}` : 'Ready to begin'}</span>
          <span className={`rounded-design px-4 py-2 text-[22px] font-bold leading-7 ${secondsRemaining <= 5 ? 'bg-incorrect text-gray-1' : 'bg-gray-2 text-ink'}`} data-warning={secondsRemaining <= 5}>{currentQuestion ? `${secondsRemaining}s` : '--'}</span>
        </div>
        <h2>{currentQuestion?.question_text || 'Start the quiz when everyone is ready.'}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {currentQuestion && ['A', 'B', 'C', 'D'].map((letter) => (
            <div className="flex min-h-16 items-center gap-4 rounded-design border border-gray-3 p-4" key={letter}>
              <span className="font-bold">{letter}</span>
              <strong>{currentQuestion[`option_${letter.toLowerCase()}`]}</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <button className="rounded-design border border-ink bg-accent px-6 py-2 text-[15px] font-bold leading-[22px] text-ink transition duration-150 ease-standard hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={startNextQuestion} disabled={!hasNextQuestion || connectionState !== 'connected'}>
          {currentQuestion ? 'Next Question' : 'Start Question'}
        </button>
        <p className="m-0 text-[15px] leading-[22px] text-gray-5">{answerCount} {answerCount === 1 ? 'player has' : 'players have'} answered</p>
      </div>
      <section className="mt-12 rounded-design border border-gray-3 bg-gray-1 p-6 shadow-panel sm:p-8" aria-labelledby="leaderboard-title">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="leaderboard-title">Live leaderboard</h2>
          <span className="text-[13px] leading-[18px] text-gray-5">{leaderboard.length} players</span>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Scores will appear after answers are submitted.</p>
        ) : (
          <ol className="m-0 grid gap-4 pl-6">
            {leaderboard.map((entry, index) => (
              <li key={entry.participantId}>
                <span>{index + 1}</span>
                <strong>Player {entry.participantId}</strong>
                <b>{entry.score}</b>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  )
}

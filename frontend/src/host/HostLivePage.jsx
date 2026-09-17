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
    return <main className="page-shell host-page"><p className="form-error">Log in to run this quiz.</p><Link className="text-link" to="/login">Log in</Link></main>
  }

  if (isLoading) return <main className="page-shell host-page"><p className="host-muted">Loading live quiz...</p></main>
  if (!quiz) return <main className="page-shell host-page"><p className="form-error" role="alert">{pageError || 'Quiz not found.'}</p></main>

  const hasNextQuestion = currentIndex + 1 < quiz.questions.length
  return (
    <main className="page-shell host-page live-page">
      <header className="live-header">
        <div>
          <p className="eyebrow">Live quiz</p>
          <h1>{quiz.title}</h1>
        </div>
        <div className="live-header-meta">
          <div className="live-room-code" aria-label={`Room code ${quiz.room_code}`}>
            <span>Room code</span>
            <strong>{quiz.room_code}</strong>
          </div>
          <div className="live-connection" data-state={connectionState}>
            <span className="connection-dot" />
            {connectionState === 'connected' ? 'Connected' : connectionState === 'error' ? 'Connection issue' : 'Connecting'}
          </div>
        </div>
      </header>
      {error && (
        <div className="socket-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={dismissError}>Dismiss</button>
        </div>
      )}
      {pageError && <p className="form-error" role="alert">{pageError}</p>}
      <section className="live-question" aria-live="polite">
        <div className="live-question-meta">
          <span>{currentQuestion ? `Question ${currentIndex + 1} of ${quiz.questions.length}` : 'Ready to begin'}</span>
          <span className="countdown" data-warning={secondsRemaining <= 5}>{currentQuestion ? `${secondsRemaining}s` : '--'}</span>
        </div>
        <h2>{currentQuestion?.question_text || 'Start the quiz when everyone is ready.'}</h2>
        <div className="live-options">
          {currentQuestion && ['A', 'B', 'C', 'D'].map((letter) => (
            <div className="live-option" key={letter}>
              <span>{letter}</span>
              <strong>{currentQuestion[`option_${letter.toLowerCase()}`]}</strong>
            </div>
          ))}
        </div>
      </section>
      <div className="live-controls">
        <button className="form-submit form-submit-inline" type="button" onClick={startNextQuestion} disabled={!hasNextQuestion || connectionState !== 'connected'}>
          {currentQuestion ? 'Next Question' : 'Start Question'}
        </button>
        <p className="answer-count">{answerCount} {answerCount === 1 ? 'player has' : 'players have'} answered</p>
      </div>
      <section className="leaderboard-panel" aria-labelledby="leaderboard-title">
        <div className="section-heading">
          <h2 id="leaderboard-title">Live leaderboard</h2>
          <span>{leaderboard.length} players</span>
        </div>
        {leaderboard.length === 0 ? (
          <p className="host-muted">Scores will appear after answers are submitted.</p>
        ) : (
          <ol className="live-leaderboard">
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

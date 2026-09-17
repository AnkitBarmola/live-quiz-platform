import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuestionTimer } from '../live/useQuestionTimer'
import { usePlayer } from './usePlayer'
import { useSocket } from '../socket/useSocket'

export function PlayPage() {
  const { quizId } = useParams()
  const { participantId, quizId: joinedQuizId, displayName } = usePlayer()
  const { socket, connectionState, error, dismissError, connectAsPlayer } = useSocket()
  const [question, setQuestion] = useState(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [answerState, setAnswerState] = useState('idle')
  const [answerResult, setAnswerResult] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [ownStanding, setOwnStanding] = useState(null)
  const secondsRemaining = useQuestionTimer(question?.id)

  useEffect(() => {
    if (participantId && String(joinedQuizId) === String(quizId)) {
      connectAsPlayer(participantId, quizId)
    }
  }, [connectAsPlayer, participantId, joinedQuizId, quizId])

  useEffect(() => {
    if (!socket) return undefined

    function handleQuestionStarted(payload) {
      console.log('question:started', payload)
      setQuestion(payload)
      setSelectedOption('')
      setAnswerState('idle')
      setAnswerResult(null)
    }

    function handleAnswerResult(payload) {
      setAnswerResult(payload)
      setAnswerState('result')
    }

    function handleLeaderboardUpdate(payload) {
      setLeaderboard(payload)
      const ownIndex = payload.findIndex((entry) => String(entry.participantId) === String(participantId))
      setOwnStanding(ownIndex >= 0 ? { rank: ownIndex + 1, score: payload[ownIndex].score } : null)
    }

    socket.on('question:started', handleQuestionStarted)
    socket.on('answer:result', handleAnswerResult)
    socket.on('leaderboard:update', handleLeaderboardUpdate)
    return () => {
      socket.off('question:started', handleQuestionStarted)
      socket.off('answer:result', handleAnswerResult)
      socket.off('leaderboard:update', handleLeaderboardUpdate)
    }
  }, [participantId, socket])

  function submitAnswer(option) {
    if (!socket || !question || answerState !== 'idle' || secondsRemaining === 0) return
    setSelectedOption(option)
    setAnswerState('submitting')
    socket.emit('player:submit-answer', {
      quizId,
      questionId: question.id,
      selectedOption: option,
    })
  }

  if (!participantId || String(joinedQuizId) !== String(quizId)) {
    return (
      <main className="join-page">
        <section className="join-panel">
          <p className="form-error" role="alert">Join this quiz before entering the play screen.</p>
          <Link className="text-link" to="/join">Return to join</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="play-page">
      <section className="play-panel" aria-live="polite">
        <p className="eyebrow">Room {quizId}</p>
        {!question && <h1>Waiting for the host to start...</h1>}
        <p className="play-player">Playing as {displayName}</p>
        {error && (
          <div className="socket-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={dismissError}>Dismiss</button>
          </div>
        )}
        {!error && connectionState === 'connecting' && <p className="play-status">Connecting...</p>}
        {!error && connectionState === 'connected' && !question && <p className="play-status">Connected. Your screen will update when the host begins.</p>}
        {question && (
          <div className="player-question">
            <div className="question-timer" data-warning={secondsRemaining <= 5}>{secondsRemaining}s</div>
            <h1>{question.question_text}</h1>
            {answerState === 'result' ? (
              <div className={`answer-result ${answerResult.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
                <strong>{answerResult.isCorrect ? 'Correct' : 'Incorrect'}</strong>
                <span>{answerResult.points} points earned</span>
                <p>Waiting for next question...</p>
              </div>
            ) : (
              <>
                <div className="answer-options">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <button
                      className="answer-option"
                      type="button"
                      key={option}
                      onClick={() => submitAnswer(option)}
                      disabled={answerState !== 'idle' || secondsRemaining === 0}
                      data-selected={selectedOption === option}
                    >
                      <span>{option}</span>
                      <strong>{question[`option_${option.toLowerCase()}`]}</strong>
                    </button>
                  ))}
                </div>
                {answerState === 'submitting' && <p className="play-status">Answer submitted. Waiting for the result...</p>}
                {secondsRemaining === 0 && <p className="play-status">Time is up. Waiting for the result...</p>}
              </>
            )}
            {ownStanding && <p className="player-standing">Your standing: {ownStanding.rank} · {ownStanding.score} points</p>}
            {leaderboard.length > 0 && <p className="play-status">Leaderboard updated</p>}
          </div>
        )}
      </section>
    </main>
  )
}

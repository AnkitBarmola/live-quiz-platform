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
      <main className="grid min-h-screen place-items-center animate-page-enter px-6 py-12 sm:px-8 sm:py-12">
        <section className="box-border w-full max-w-[560px] rounded-design border border-gray-3 bg-gray-1 p-8 shadow-panel sm:p-12">
          <p className="rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">Join this quiz before entering the play screen.</p>
          <Link className="mt-6 inline-block text-[15px] font-bold leading-[22px] text-ink" to="/join">Return to join</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center animate-page-enter px-6 py-12 sm:px-8 sm:py-12">
      <section className="box-border w-full max-w-[720px] rounded-design border border-gray-3 bg-gray-1 p-8 text-center shadow-panel sm:p-12" aria-live="polite">
        <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Room {quizId}</p>
        {!question && <h1>Waiting for the host to start...</h1>}
        <p className="mt-6 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5 normal-case">Playing as {displayName}</p>
        {error && (
          <div className="mt-8 flex items-center justify-between gap-4 rounded-design border border-incorrect p-4 text-left text-[13px] leading-[18px] text-incorrect" role="alert">
            <span>{error}</span>
            <button className="shrink-0 border-0 bg-transparent p-2 font-bold text-inherit" type="button" onClick={dismissError}>Dismiss</button>
          </div>
        )}
        {!error && connectionState === 'connecting' && <p className="mt-6 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Connecting...</p>}
        {!error && connectionState === 'connected' && !question && <p className="mt-6 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Connected. Your screen will update when the host begins.</p>}
        {question && (
          <div className="mt-8">
            <div className={`mx-auto w-fit rounded-design px-4 py-2 text-[22px] font-bold leading-7 ${secondsRemaining <= 5 ? 'bg-incorrect text-gray-1' : 'bg-gray-2 text-ink'}`} data-warning={secondsRemaining <= 5}>{secondsRemaining}s</div>
            <h1>{question.question_text}</h1>
            {answerState === 'result' ? (
              <div className={`mt-8 rounded-design border p-6 ${answerResult.isCorrect ? 'border-correct text-correct' : 'border-incorrect text-incorrect'}`}>
                <strong className="block text-[34px] font-bold leading-10">{answerResult.isCorrect ? 'Correct!' : 'Incorrect'}</strong>
                <span className="mt-2 block text-[15px] leading-[22px] text-gray-5">{answerResult.points} points earned</span>
                <p className="mt-4 text-[15px] leading-[22px] text-gray-5">Waiting for next question...</p>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <button
                      className="flex min-h-16 items-center gap-4 rounded-design border border-gray-3 bg-gray-1 p-4 text-left text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-60 data-[selected=true]:border-ink data-[selected=true]:bg-accent"
                      type="button"
                      key={option}
                      onClick={() => submitAnswer(option)}
                      disabled={answerState !== 'idle' || secondsRemaining === 0}
                      data-selected={selectedOption === option}
                    >
                      <span className="font-bold">{option}</span>
                      <strong className="normal-case">{question[`option_${option.toLowerCase()}`]}</strong>
                    </button>
                  ))}
                </div>
                {answerState === 'submitting' && <p className="mt-6 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Answer submitted. Waiting for the result...</p>}
                {secondsRemaining === 0 && <p className="mt-6 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Time is up. Waiting for the result...</p>}
              </>
            )}
            {ownStanding && <p className="mt-6 text-[15px] leading-[22px] text-ink">Your standing: {ownStanding.rank} · {ownStanding.score} points</p>}
            {leaderboard.length > 0 && <p className="mt-6 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Leaderboard updated</p>}
          </div>
        )}
      </section>
    </main>
  )
}

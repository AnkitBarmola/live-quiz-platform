import { useEffect, useState } from 'react'

const QUESTION_DURATION_SECONDS = 20

export function useQuestionTimer(questionId) {
  const [secondsRemaining, setSecondsRemaining] = useState(QUESTION_DURATION_SECONDS)

  useEffect(() => {
    if (!questionId) {
      setSecondsRemaining(QUESTION_DURATION_SECONDS)
      return undefined
    }

    setSecondsRemaining(QUESTION_DURATION_SECONDS)
    // TODO: Read the duration from the server if question timing becomes configurable.
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [questionId])

  return secondsRemaining
}

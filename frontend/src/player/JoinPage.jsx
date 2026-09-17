import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, joinQuiz } from '../api/client'
import { usePlayer } from './usePlayer'

export function JoinPage() {
  const navigate = useNavigate()
  const { joinPlayer } = usePlayer()
  const [values, setValues] = useState({ roomCode: '', displayName: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateValue(event) {
    const { name, value } = event.target
    const nextValue = name === 'roomCode' ? value.replace(/[^a-zA-Z0-9]/g, '') : value
    setValues((current) => ({ ...current, [name]: nextValue }))
    setErrors((current) => ({ ...current, [name]: '', form: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.roomCode) nextErrors.roomCode = 'Enter the room code.'
    if (!values.displayName.trim()) nextErrors.displayName = 'Enter your display name.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const result = await joinQuiz({
        roomCode: values.roomCode,
        displayName: values.displayName.trim(),
      })
      joinPlayer(result.participant)
      navigate(`/play/${result.participant.quiz_id}`)
    } catch (error) {
      setErrors({ form: error instanceof ApiError ? error.message : 'Unable to reach the server.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="join-page">
      <section className="join-panel" aria-labelledby="join-title">
        <p className="eyebrow">Live quiz platform</p>
        <h1 id="join-title">Join a quiz</h1>
        <p className="join-intro">Enter the room code from your lecturer and choose a display name.</p>
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        <form onSubmit={handleSubmit}>
          <div className="join-field">
            <label htmlFor="roomCode">Room code</label>
            <input
              id="roomCode"
              name="roomCode"
              value={values.roomCode}
              onChange={updateValue}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
              inputMode="text"
              aria-invalid={Boolean(errors.roomCode)}
            />
            {errors.roomCode && <p className="field-error">{errors.roomCode}</p>}
          </div>
          <div className="join-field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              value={values.displayName}
              onChange={updateValue}
              autoComplete="nickname"
              aria-invalid={Boolean(errors.displayName)}
            />
            {errors.displayName && <p className="field-error">{errors.displayName}</p>}
          </div>
          <button className="join-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Join quiz'}
          </button>
        </form>
      </section>
    </main>
  )
}

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
    <main className="grid min-h-screen place-items-center animate-page-enter px-6 py-12 sm:px-8 sm:py-12">
      <section className="box-border w-full max-w-[560px] rounded-design border border-gray-3 bg-gray-1 p-8 shadow-panel sm:p-12" aria-labelledby="join-title">
        <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Live quiz platform</p>
        <h1 id="join-title">Join a quiz</h1>
        <p className="my-4 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">Enter the room code from your lecturer and choose a display name.</p>
        {errors.form && <p className="mb-6 mt-2 rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{errors.form}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mt-6">
            <label className="mb-2 block text-[15px] font-bold leading-[22px]" htmlFor="roomCode">Room code</label>
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
              className="box-border min-h-12 w-full rounded-design border border-gray-4 bg-gray-1 px-4 py-4 text-[17px] font-bold leading-6 tracking-[2px] text-ink outline-2 outline-accent outline-offset-1 focus:border-gray-6 aria-[invalid=true]:border-incorrect"
            />
            {errors.roomCode && <p className="m-0 mt-2 text-[13px] leading-[18px] text-incorrect">{errors.roomCode}</p>}
          </div>
          <div className="mt-6">
            <label className="mb-2 block text-[15px] font-bold leading-[22px]" htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              value={values.displayName}
              onChange={updateValue}
              autoComplete="nickname"
              aria-invalid={Boolean(errors.displayName)}
              className="box-border min-h-12 w-full rounded-design border border-gray-4 bg-gray-1 px-4 py-4 text-[17px] leading-6 text-ink outline-2 outline-accent outline-offset-1 focus:border-gray-6 aria-[invalid=true]:border-incorrect normal-case"
            />
            {errors.displayName && <p className="m-0 mt-2 text-[13px] leading-[18px] text-incorrect">{errors.displayName}</p>}
          </div>
          <button className="mt-8 min-h-12 w-full rounded-design border border-ink bg-accent px-4 py-4 text-[17px] font-bold leading-6 text-ink transition duration-150 ease-standard hover:-translate-y-px disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Join quiz'}
          </button>
        </form>
      </section>
    </main>
  )
}

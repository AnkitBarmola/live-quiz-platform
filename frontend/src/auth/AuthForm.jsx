import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, registerUser } from '../api/client'
import { useAuth } from './useAuth'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values, isRegister) {
  const errors = {}

  if (isRegister && values.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.'
  }

  if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

function Field({ id, label, type = 'text', value, onChange, error, autoComplete }) {
  return (
    <div className="mt-6">
      <label className="mb-2 block text-[13px] font-bold leading-[18px]" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="box-border min-h-8 w-full rounded-design border border-gray-4 bg-gray-1 px-4 py-2 text-[15px] leading-[22px] text-ink outline-2 outline-accent outline-offset-1 focus:border-gray-6 aria-[invalid=true]:border-incorrect"
      />
      {error && <p className="m-0 mt-2 text-[13px] leading-[18px] text-incorrect" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

export function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [values, setValues] = useState({ username: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registered] = useState(Boolean(location.state?.registered))

  function updateValue(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setRequestError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values, isRegister)
    setErrors(nextErrors)
    setRequestError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      if (isRegister) {
        await registerUser(values)
        navigate('/login', { state: { registered: true }, replace: true })
      } else {
        await login({ email: values.email.trim(), password: values.password })
        navigate('/host/dashboard', { replace: true })
      }
    } catch (error) {
      setRequestError(error instanceof ApiError ? error.message : 'Unable to reach the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center animate-page-enter px-6 py-12 sm:px-8 sm:py-16">
      <section className="box-border w-full max-w-[480px] rounded-design border border-gray-3 bg-gray-1 p-8 shadow-panel sm:p-12" aria-labelledby="auth-title">
        <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Live quiz platform</p>
        <h1 id="auth-title">{isRegister ? 'Create an account' : 'Log in'}</h1>
        <p className="my-4 text-[15px] leading-[22px] tracking-[0.01px] text-gray-5">
          {isRegister ? 'Set up a host account to manage live quizzes.' : 'Sign in to manage your hosted quizzes.'}
        </p>
        {registered && <p className="mb-6 mt-2 rounded-design border border-correct p-4 text-[13px] leading-[18px] text-correct" role="status">Account created. You can now log in.</p>}
        {requestError && <p className="mb-6 mt-2 rounded-design border border-incorrect p-4 text-[13px] leading-[18px] text-incorrect" role="alert">{requestError}</p>}
        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <Field
              id="username"
              label="Username"
              value={values.username}
              onChange={updateValue}
              error={errors.username}
              autoComplete="username"
            />
          )}
          <Field
            id="email"
            label="Email"
            type="email"
            value={values.email}
            onChange={updateValue}
            error={errors.email}
            autoComplete="email"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            value={values.password}
            onChange={updateValue}
            error={errors.password}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <button className="mt-8 min-h-8 w-full rounded-design border border-ink bg-accent px-4 py-2 text-[15px] font-bold leading-[22px] text-ink transition duration-150 ease-standard hover:-translate-y-px disabled:cursor-wait disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="mt-8 text-center text-[13px] leading-[18px] text-gray-5">
          {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
          <Link className="font-bold text-ink" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Register'}</Link>
        </p>
      </section>
    </main>
  )
}

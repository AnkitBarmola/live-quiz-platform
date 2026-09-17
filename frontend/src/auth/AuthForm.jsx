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
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
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
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">Live quiz platform</p>
        <h1 id="auth-title">{isRegister ? 'Create an account' : 'Log in'}</h1>
        <p className="auth-intro">
          {isRegister ? 'Set up a host account to manage live quizzes.' : 'Sign in to manage your hosted quizzes.'}
        </p>
        {registered && <p className="success-message" role="status">Account created. You can now log in.</p>}
        {requestError && <p className="form-error" role="alert">{requestError}</p>}
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
          <button className="form-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Register'}</Link>
        </p>
      </section>
    </main>
  )
}

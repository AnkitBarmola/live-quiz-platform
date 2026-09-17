export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(
      payload.error ?? 'The request could not be completed.',
      response.status,
      payload.details ?? [],
    )
  }

  return payload
}

export function registerUser({ username, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export function loginUser({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function createQuiz({ title, description }, token) {
  return request('/quizzes', {
    method: 'POST',
    token,
    body: JSON.stringify({ title, description }),
  })
}

export function getQuiz(quizId, token) {
  return request(`/quizzes/${quizId}`, { token })
}

export function addQuestion(quizId, question, token) {
  return request(`/quizzes/${quizId}/questions`, {
    method: 'POST',
    token,
    body: JSON.stringify(question),
  })
}

export function startQuiz(quizId, token) {
  console.log(`[QuizEditor] Starting quiz ${quizId}: POST ${API_BASE_URL}/quizzes/${quizId}/start`)
  return request(`/quizzes/${quizId}/start`, {
    method: 'POST',
    token,
  })
}

export function joinQuiz({ roomCode, displayName }) {
  return request('/quizzes/join', {
    method: 'POST',
    body: JSON.stringify({ roomCode, displayName }),
  })
}

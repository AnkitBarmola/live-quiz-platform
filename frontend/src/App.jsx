import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthForm } from './auth/AuthForm'
import { HostDashboard } from './host/HostDashboard'
import { HostLivePage } from './host/HostLivePage'
import { QuizEditor } from './host/QuizEditor'
import { JoinPage } from './player/JoinPage'
import { PlayPage } from './player/PlayPage'
import { SocketProvider } from './socket/SocketContext'
import { useAuth } from './auth/useAuth'

const pages = [
  { path: '/login', title: 'Log in' },
  { path: '/register', title: 'Create your account' },
  { path: '/host/dashboard', title: 'Host dashboard' },
  { path: '/host/quiz/:quizId', title: 'Quiz overview' },
  { path: '/host/quiz/:quizId/live', title: 'Live quiz' },
  { path: '/join', title: 'Join a quiz' },
  { path: '/play/:quizId', title: 'Play quiz' },
]

function LandingPage() {
  const { token } = useAuth()

  return (
    <main className="landing-page">
      <section className="landing-content" aria-labelledby="landing-title">
        <p className="eyebrow">Live quiz platform</p>
        <h1 id="landing-title">Live quizzes for classrooms</h1>
        <p className="landing-intro">Create a quiz for your class or join one with a room code.</p>
        <div className="landing-actions">
          <Link className="landing-action landing-action-primary" to={token ? '/host/dashboard' : '/login'}>
            Host a Quiz
          </Link>
          <Link className="landing-action landing-action-secondary" to="/join">
            Join a Quiz
          </Link>
        </div>
      </section>
    </main>
  )
}

function Page({ title }) {
  return (
    <main className="page-shell">
      <p className="eyebrow">Live quiz platform</p>
      <h1>{title}</h1>
      {title === 'Welcome' && (
        <Link className="text-link" to="/join">
          Join a quiz
        </Link>
      )}
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />
          <Route path="/host/dashboard" element={<HostDashboard />} />
          <Route path="/host/quiz/:quizId" element={<QuizEditor />} />
          <Route path="/host/quiz/:quizId/live" element={<HostLivePage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/play/:quizId" element={<PlayPage />} />
          {pages
            .filter((page) => !['/login', '/register', '/host/dashboard', '/host/quiz/:quizId', '/host/quiz/:quizId/live', '/join', '/play/:quizId'].includes(page.path))
            .map((page) => (
              <Route key={page.path} path={page.path} element={<Page title={page.title} />} />
            ))}
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  )
}

export default App

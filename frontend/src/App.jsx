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
    <main className="grid min-h-screen place-items-center animate-page-enter px-6 py-12 sm:px-8">
      <section className="w-full max-w-[680px] text-center" aria-labelledby="landing-title">
        <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Live quiz platform</p>
        <h1 id="landing-title">Live quizzes for classrooms</h1>
        <p className="mx-auto mt-4 text-[17px] leading-6 text-gray-5">Create a quiz for your class or join one with a room code.</p>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link className="grid min-h-16 place-items-center rounded-design border border-ink bg-ink px-6 py-4 text-[17px] font-bold leading-6 text-gray-1 no-underline transition duration-150 ease-standard hover:-translate-y-px" to={token ? '/host/dashboard' : '/login'}>
            Host a Quiz
          </Link>
          <Link className="grid min-h-16 place-items-center rounded-design border border-ink bg-accent px-6 py-4 text-[17px] font-bold leading-6 text-ink no-underline transition duration-150 ease-standard hover:-translate-y-px" to="/join">
            Join a Quiz
          </Link>
        </div>
      </section>
    </main>
  )
}

function Page({ title }) {
  return (
    <main className="box-border min-h-screen max-w-[960px] mx-auto animate-page-enter px-6 py-12 sm:px-8 sm:py-16">
      <p className="m-0 text-[13px] font-bold uppercase leading-[18px] text-gray-5">Live quiz platform</p>
      <h1>{title}</h1>
      {title === 'Welcome' && (
        <Link className="mt-6 inline-block text-[15px] font-bold leading-[22px] text-ink">
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

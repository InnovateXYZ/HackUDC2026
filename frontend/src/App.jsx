import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
// Styling now handled via Tailwind in src/index.css and utility classes in components
import Login from './components/Login'
import MainScreen from './components/MainScreen'
import Register from './components/Register'
import GitHubCallback from './components/GitHubCallback'
import { getToken } from './utils/auth'

// Simple auth guard – redirects to login when no token is stored
function RequireAuth({ children }) {
  const { token } = getToken()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <MainScreen />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
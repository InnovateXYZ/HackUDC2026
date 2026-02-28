import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
// Styling now handled via Tailwind in src/index.css and utility classes in components
import Login from './components/Login'
import MainScreen from './components/MainScreen'
import Register from './components/Register'
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
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/chat"
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
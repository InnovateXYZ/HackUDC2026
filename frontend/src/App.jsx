import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
// Styling now handled via Tailwind in src/index.css and utility classes in components
import Login from './components/Login'
import Register from './components/Register'
import Home from './components/Home'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
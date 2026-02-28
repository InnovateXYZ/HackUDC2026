import { useState } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import './App.css'

function App() {
  const [mode, setMode] = useState('register') // start on register

  return (
    <div className="App">
      {mode === 'register' ? (
        <Register onSwitch={setMode} />
      ) : (
        <Login onSwitch={setMode} />
      )}
    </div>
  )
}

export default App
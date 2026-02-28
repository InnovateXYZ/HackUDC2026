import { useState } from 'react';
import { saveToken } from '../utils/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Para mostrar errores de login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Estructura que espera tu servidor
    const dataToSend = {
      email: email,
      password: password
    };

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login:', data);
        // Save token and user info if available
        if (data.access_token) {
          saveToken(data.access_token, data.token_type);
        }
        if (data.user) {
          try {
            localStorage.setItem('user', JSON.stringify(data.user));
          } catch (err) {
            console.warn('Error to save in local storage', err);
          }
        }
        alert('Welcome!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error logging in');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Could not connect to the server');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>LogIn</h2>

        {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>{error}</p>}

        <div className="input-group">
          <label>Email:</label>
          <input
            type="text" // Cambiado a text para permitir username o email
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@mail.com"
            required
          />
        </div>

        <div className="input-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <button type="submit">LogIn</button>
      </form>
    </div>
  );
}

export default Login;
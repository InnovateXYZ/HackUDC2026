import { useState } from 'react';
import { saveToken } from '../utils/auth';

function Login({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // To display login errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Structure expected by your server
    const dataToSend = {
      username: email, // send the input value to both fields
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
        <h2>Log In</h2>
        
        {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>{error}</p>}

        <div className="input-group">
          <label>Email</label>
          <input 
            type="text" // changed to text to allow username or email
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

        <button type="submit">Log In</button>
        <div className="switch-box">
          <p className="switch-text">
            Don't have an account?{' '}
            <span className="switch-link" onClick={() => onSwitch && onSwitch('register')}>
              Click here
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;
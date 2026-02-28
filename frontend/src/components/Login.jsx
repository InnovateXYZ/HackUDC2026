import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveToken } from '../utils/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // To display login errors
  const navigate = useNavigate();

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
        navigate('/chat');
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
    <div className="min-h-screen flex items-center justify-center w-full">
      <form onSubmit={handleSubmit} className="bg-[#242424] p-8 rounded-lg shadow-lg w-full max-w-sm flex flex-col gap-5 text-white">
        <h2 className="text-2xl font-semibold">Log In</h2>

        {error && <p className="text-[#ff4d4d] text-sm">{error}</p>}

        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@mail.com"
            required
            className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
          />
        </div>

        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="login-password">Password:</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
            className="w-full px-3 py-2 rounded border border-[#646cff] bg-[#1a1a1a] text-white outline-none focus:border-[#f47721]"
          />
        </div>

        <button type="submit" className="btn-primary mt-2">Log In</button>
        <div className="bg-[#2a2a2a] p-2 rounded mt-2 text-center">
          <p className="text-sm text-white">
            Don't have an account?{' '}
            <button type="button" className="text-[#f47721] underline" onClick={() => navigate('/register')}>
              Click here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Login;
import { useState } from 'react';

function Register({ onSwitch }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // currently not connected to any backend
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    console.log('Simulated registration:', { username, email, password });
    alert('Simulated registration, check console');
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Register</h2>

        {error && <p style={{ color: '#ffb347', fontSize: '0.8rem' }}>{error}</p>}

        <div className="input-group">
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            required
          />
        </div>

        <div className="input-group">
          <label>Email:</label>
          <input
            type="email"
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

        <div className="input-group">
          <label>Confirm password:</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="********"
            required
          />
        </div>

        <button type="submit">Create account</button>
        <div className="switch-box">
          <p className="switch-text">
            Already have an account?{' '}
            <span className="switch-link" onClick={() => onSwitch && onSwitch('login')}>
              Click here
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}

export default Register;

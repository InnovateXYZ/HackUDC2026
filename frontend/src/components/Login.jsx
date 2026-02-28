import { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Para mostrar errores de login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Estructura que espera tu servidor
    const dataToSend = {
      username: email, // Enviamos el valor del input a ambos
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
        console.log('Login exitoso:', data);
        alert('¡Bienvenido!');
        // Aquí podrías guardar el token en localStorage o redireccionar
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error de red:', err);
      setError('No se pudo conectar con el servidor');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>LogIn</h2>
        
        {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>{error}</p>}

        <div className="input-group">
          <label>Email o Username:</label>
          <input 
            type="text" // Cambiado a text para permitir username o email
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@mail.com o username"
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
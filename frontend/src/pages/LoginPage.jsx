import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { storeAuth } from '../utils/auth';
import './LoginPage.css';
const LoginPage = ({ onLoginSuccess }) => {
    const [searchParams] = useSearchParams();
    const isAdminPortal = searchParams.get('admin') === '1';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok && data.token) {
                storeAuth(data.token, {
                    id: data.id,
                    email: data.email,
                    role: data.role,
                    verified: data.verified || false,
                });
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess();
                if (data.role === 'ADMIN') {
                    navigate('/admin');
                }
                else {
                    navigate('/dashboard');
                }
            }
            else {
                const errorText = data.error || data.message || 'Login failed. Please try again.';
                if (data.deactivated) {
                    setError('Account deactivated. Please contact the administrator.');
                    setTimeout(() => setError(''), 5000);
                }
                else {
                    setError(errorText);
                }
            }
        }
        catch (err) {
            setError('Network error. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="app-title">Fly High</h1>
          <p className="app-subtitle">
            {isAdminPortal ? 'Admin Portal' : 'Flight Booking System'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" className="form-input" autoComplete="email"/>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password" className="form-input" autoComplete="current-password"/>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            New user? <Link to="/signup" className="signup-link">Register here</Link>
          </p>
        </div>
      </div>
    </div>);
};
export default LoginPage;

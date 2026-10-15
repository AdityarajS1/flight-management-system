import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './EmailVerificationPage.css';
const EmailVerificationPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided');
            return;
        }
        const verifyEmail = async () => {
            try {
                const response = await fetch(`/api/auth/verify?token=${token}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    setStatus('success');
                    setMessage(data.message);
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
                else {
                    setStatus('error');
                    setMessage(data.error || 'Email verification failed');
                }
            }
            catch (err) {
                setStatus('error');
                setMessage('An error occurred during verification');
                console.error('Verification error:', err);
            }
        };
        verifyEmail();
    }, [searchParams, navigate]);
    return (<div className="verification-page">
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <div className="logo">✈</div>
            <h1>Email Verification</h1>
          </div>
          
          <div className="verification-content">
            {status === 'loading' && (<div className="loading-state">
                <div className="spinner"></div>
                <p>Verifying your email...</p>
              </div>)}
            
            {status === 'success' && (<div className="success-state">
                <div className="success-icon">✓</div>
                <h2>Verification Successful!</h2>
                <p>{message}</p>
                <p className="redirect-info">You will be redirected to the login page in a few seconds...</p>
                <button onClick={() => navigate('/login')} className="login-button">
                  Go to Login
                </button>
              </div>)}
            
            {status === 'error' && (<div className="error-state">
                <div className="error-icon">✗</div>
                <h2>Verification Failed</h2>
                <p>{message}</p>
                <div className="error-actions">
                  <button onClick={() => navigate('/login')} className="login-button">
                    Back to Login
                  </button>
                  <button onClick={() => window.location.reload()} className="retry-button">
                    Try Again
                  </button>
                </div>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
};
export default EmailVerificationPage;

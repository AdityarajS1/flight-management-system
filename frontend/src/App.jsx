import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserSidebar from './components/UserSidebar';
import SearchPage from './pages/SearchPage';
import BookingPage from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import FlightsPage from './pages/FlightsPage';
import PaymentPage from './pages/PaymentPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserProfile from './pages/UserProfile';
import { clearStoredAuth, getStoredToken, getStoredUser, isAdminUser } from './utils/auth';
import './App.css';
const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const refreshAuthState = () => {
        const token = getStoredToken();
        const storedUser = getStoredUser();
        if (token && storedUser) {
            setIsAuthenticated(true);
            setUser(storedUser);
        }
        else {
            setIsAuthenticated(false);
            setUser(null);
        }
    };
    useEffect(() => {
        refreshAuthState();
        setLoading(false);
    }, []);
    const handleLogout = () => {
        clearStoredAuth();
        setIsAuthenticated(false);
        setUser(null);
        window.location.replace('/login');
    };
    const handleAdminLogout = () => {
        clearStoredAuth();
        window.location.replace('/login');
    };
    if (loading) {
        return (<div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading Fly High...</p>
      </div>);
    }
    return (<Router>
      <div className="App">
        {isAuthenticated ? (isAdminUser(user) ? (<main className="admin-main-content">
              <Routes>
                <Route path="/admin" element={<AdminPage onLogout={handleAdminLogout}/>}/>
                <Route path="*" element={<Navigate to="/admin" replace/>}/>
              </Routes>
            </main>) : (<>
              <UserSidebar user={user} onLogout={handleLogout}/>
              <main className="user-main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                  <Route path="/dashboard" element={<DashboardPage />}/>
                  <Route path="/flights" element={<FlightsPage />}/>
                  <Route path="/search" element={<SearchPage />}/>
                  <Route path="/profile" element={<UserProfile />}/>
                  <Route path="/payment-history" element={<PaymentHistoryPage />}/>
                  <Route path="/booking/:flightId" element={<BookingPage />}/>
                  <Route path="/payment" element={<PaymentPage />}/>
                  <Route path="/login" element={<Navigate to="/dashboard" replace/>}/>
                  <Route path="/admin" element={<Navigate to="/dashboard" replace/>}/>
                  <Route path="/booking" element={<Navigate to="/flights" replace/>}/>
                  <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
                </Routes>
              </main>
            </>)) : (<main className="public-main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace/>}/>
              <Route path="/login" element={<LoginPage onLoginSuccess={refreshAuthState}/>}/>
              <Route path="/admin" element={<Navigate to="/login?admin=1" replace/>}/>
              <Route path="/signup" element={<SignupPage />}/>
              <Route path="/email-verification" element={<EmailVerificationPage />}/>
              <Route path="/dashboard" element={<Navigate to="/login" replace/>}/>
              <Route path="/flights" element={<Navigate to="/login" replace/>}/>
              <Route path="/search" element={<Navigate to="/login" replace/>}/>
              <Route path="/profile" element={<Navigate to="/login" replace/>}/>
              <Route path="/booking/:flightId" element={<Navigate to="/login" replace/>}/>
              <Route path="/booking" element={<Navigate to="/login" replace/>}/>
              <Route path="/payment" element={<Navigate to="/login" replace/>}/>
              <Route path="/payment-history" element={<Navigate to="/login" replace/>}/>
              <Route path="*" element={<Navigate to="/login" replace/>}/>
            </Routes>
          </main>)}
      </div>
    </Router>);
};
export default App;

import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
const Navbar = ({ user, onLogout }) => {
    return (<nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          Fly High
        </Link>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/search" className="nav-link">Search Flights</Link>
          {(user === null || user === void 0 ? void 0 : user.role) === 'USER' && (<Link to="/profile" className="nav-link">My Profile</Link>)}
          {(user === null || user === void 0 ? void 0 : user.role) === 'ADMIN' && (<Link to="/login?admin=1" className="nav-link">Admin Login</Link>)}
          {user && (<div className="user-menu">
              <span className="user-name">Welcome, {user.name || user.email}</span>
              <button onClick={onLogout} className="logout-btn">
                Logout
              </button>
            </div>)}
        </div>
      </div>
    </nav>);
};
export default Navbar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './UserSidebar.css';
const UserSidebar = ({ user, onLogout }) => {
    var _a;
    const location = useLocation();
    const menuItems = [
        { path: '/dashboard', icon: '🏠', label: 'Dashboard / Home' },
        { path: '/flights', icon: '✈️', label: 'Flights Available' },
        { path: '/search', icon: '🔍', label: 'Search Flights' },
        { path: '/profile', icon: '📄', label: 'Profile' },
        { path: '/payment-history', icon: '💳', label: 'Payment History' },
    ];
    const isActive = (path) => location.pathname === path;
    return (<div className="user-sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            {((_a = user === null || user === void 0 ? void 0 : user.name) === null || _a === void 0 ? void 0 : _a.charAt(0).toUpperCase()) || 'U'}
          </div>
          <div className="user-details">
            <h3>{(user === null || user === void 0 ? void 0 : user.name) || 'User'}</h3>
            <p>{(user === null || user === void 0 ? void 0 : user.email) || 'user@example.com'}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => (<li key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
              <Link to={item.path} className="nav-link">
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="logout-btn">
          <span className="logout-icon">🚪</span>
          <span className="logout-label">Logout</span>
        </button>
      </div>
    </div>);
};
export default UserSidebar;

import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
const Navbar = () => {
    return (<nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-logo">
          ✈️ Flight Management
        </Link>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/search" className="nav-link">Search Flights</Link>
          <Link to="/flights" className="nav-link">Flights</Link>
          <Link to="/login?admin=1" className="nav-link">Admin Login</Link>
        </div>
      </div>
    </nav>);
};
export default Navbar;

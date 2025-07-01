import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useNavigate } from 'react-router-dom';
import './navbar.css';

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="main-navbar">
      <div className="logo">
        <Link to="/" className="logo-link">Laptop System</Link>
      </div>
      <div className="nav-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/available-laptops" className="nav-link">Laptops</Link>
     
        <Link to="/user-stats" className="nav-link">Stats</Link>
        <Link to="/clearance" className="nav-link">Clearance</Link>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}
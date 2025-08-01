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
        {localStorage.getItem('role') === 'admin' ? (
          <>
            <Link to="/admin/available-laptops" className="nav-link">Manage Laptops</Link>
            <Link to="/Manage-Inventory" className="nav-link">Manage Inventory</Link>
            <Link to="/analytics" className="nav-link">Analytics</Link>
          </>
        ) : (
          <>
            <Link to="/available-laptops" className="nav-link">Available Laptops</Link>
            <Link to="/user-stats" className="nav-link">Stats</Link>
            <Link to="/clearance" className="nav-link">Clearance</Link>
            <Link to="/user-manual" className="nav-link" style={{
              background: '#e0f2fe',
              color: '#0284c7',
              borderRadius: '6px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span role="img" aria-label="book">📖</span>
              User Guide
            </Link>
          </>
        )}
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
}
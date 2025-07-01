import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import './PublicNavbar.css';

export default function PublicNavbar() {
  const { user } = useAuth();

  return (
    <nav className="public-navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-link">SLFS System</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About Us</Link>
        <Link to="/services" className="nav-link">Services</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        {user ? (
          <Link to="/dashboard" className="login-btn">Dashboard</Link>
        ) : (
          <Link to="/login" className="login-btn">Login</Link>
        )}
      </div>
    </nav>
  );
}
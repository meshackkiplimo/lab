import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import PublicNavbar from '../components/PublicNavbar';
import './public-pages.css';

export default function Home() {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="page-container">
      <PublicNavbar />
      <div className="content-wrapper">
        <section className="hero-section">
          <h1 className="hero-title">Welcome to Smart Laptop Finance System</h1>
          <p className="hero-description">
            Your all-in-one solution for managing laptops, applications, and payments—securely and efficiently.
          </p>
          <div className="hero-cta">
            <Link to="/login" className="cta-button">Get Started</Link>
            <Link to="/services" className="cta-button secondary">Our Services</Link>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <h3>Easy Application</h3>
              <p>Simple and straightforward laptop financing application process designed for students.</p>
            </div>
            <div className="feature-card">
              <h3>Flexible Payments</h3>
              <p>Convenient payment options through M-Pesa integration for hassle-free transactions.</p>
            </div>
            <div className="feature-card">
              <h3>Quick Processing</h3>
              <p>Fast application processing and rapid response times for your convenience.</p>
            </div>
            <div className="feature-card">
              <h3>24/7 Support</h3>
              <p>Round-the-clock assistance for all your queries and concerns.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
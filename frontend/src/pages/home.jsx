import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import PublicNavbar from '../components/PublicNavbar';
import './public-pages.css';
import laptopImage from '../assets/img/kk.jpg'

export default function Home() {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="page-container">
      <PublicNavbar />
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Transform Your Learning Experience</h1>
          <p className="hero-description">
            Access high-quality laptops through our flexible financing system.
            Empower your education with reliable technology, manageable payments,
            and a seamless application process designed for students.
          </p>
          <div className="hero-cta">
            <Link to="/login" className="cta-button">Get Started</Link>
            <Link to="/services" className="cta-button secondary">Learn More</Link>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={laptopImage} alt="Laptop Management System" className="hero-image" />
        </div>
      </section>
    </div>
  );
}
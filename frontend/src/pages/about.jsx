import React from 'react';
import PublicNavbar from '../components/PublicNavbar';
import './public-pages.css';

export default function About() {
  return (
    <div className="page-container">
      <PublicNavbar />
      <div className="content-wrapper">
        <section className="about-section">
          <h1 className="page-title">About Us</h1>
          <div className="about-content">
            <div className="mission-section">
              <h2>Our Mission</h2>
              <p>
                At LaptopSys, we're committed to making technology accessible to every student. 
                Our smart financing system ensures that every student has the opportunity to 
                acquire the tools they need for their academic success.
              </p>
            </div>

            <div className="values-section">
              <h2>Our Values</h2>
              <div className="values-grid">
                <div className="value-card">
                  <h3>Accessibility</h3>
                  <p>Making technology available to all students through smart financing options.</p>
                </div>
                <div className="value-card">
                  <h3>Innovation</h3>
                  <p>Leveraging technology to create seamless and efficient processes.</p>
                </div>
                <div className="value-card">
                  <h3>Support</h3>
                  <p>Providing continuous support throughout the financing journey.</p>
                </div>
                <div className="value-card">
                  <h3>Integrity</h3>
                  <p>Maintaining transparency and trust in all our operations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
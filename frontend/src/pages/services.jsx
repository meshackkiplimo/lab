import React from 'react';
import PublicNavbar from '../components/PublicNavbar';
import './public-pages.css';

export default function Services() {
  return (
    <div className="page-container">
      <PublicNavbar />
      <div className="content-wrapper">
        <section className="services-section">
          <h1 className="page-title">Our Services</h1>
          <div className="services-grid">
            <div className="service-card">
              <h2>Laptop Financing</h2>
              <p>
                Easy and flexible financing options for students to acquire laptops
                for their academic needs. Choose from various payment plans that 
                suit your budget.
              </p>
              <ul className="service-features">
                <li>Flexible payment terms</li>
                <li>Low interest rates</li>
                <li>Quick approval process</li>
                <li>Student-friendly options</li>
              </ul>
            </div>

            <div className="service-card">
              <h2>Easy Application</h2>
              <p>
                Streamlined application process designed specifically for students.
                Get quick responses and minimal paperwork.
              </p>
              <ul className="service-features">
                <li>Online application</li>
                <li>Fast processing</li>
                <li>Simple documentation</li>
                <li>24/7 support</li>
              </ul>
            </div>

            <div className="service-card">
              <h2>Mpesa Integration</h2>
              <p>
                Convenient payment solutions through Mpesa integration. Make your
                payments easily and securely through your mobile phone.
              </p>
              <ul className="service-features">
                <li>Secure transactions</li>
                <li>Instant confirmation</li>
                <li>Payment tracking</li>
                <li>Transaction history</li>
              </ul>
            </div>

            <div className="service-card">
              <h2>Technical Support</h2>
              <p>
                Dedicated technical support for all your laptop-related queries
                and issues throughout your financing period.
              </p>
              <ul className="service-features">
                <li>Expert assistance</li>
                <li>Quick response time</li>
                <li>Regular maintenance tips</li>
                <li>Hardware support</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
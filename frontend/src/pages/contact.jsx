import React from 'react';
import PublicNavbar from '../components/PublicNavbar';
import './public-pages.css';

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic would go here
    alert('Message sent successfully!');
  };

  return (
    <div className="page-container">
      <PublicNavbar />
      <div className="content-wrapper">
        <section className="contact-section">
          <h1 className="page-title">Contact Us</h1>
          
          <div className="contact-content">
            <div className="contact-info">
              <div className="info-card">
                <h3>Our Location</h3>
                <p>Dedan Kimathi University</p>
                <p>Private Bag</p>
                <p>Nyeri, Kenya</p>
              </div>

              <div className="info-card">
                <h3>Contact Information</h3>
                <p>Email: support@laptopsys.com</p>
                <p>Phone: +254 700 000 000</p>
                <p>Hours: Mon-Fri 8:00 AM - 5:00 PM</p>
              </div>
            </div>

            <div className="contact-form-container">
              <h2>Send us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    placeholder="Enter subject"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    placeholder="Enter your message"
                    rows="5"
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
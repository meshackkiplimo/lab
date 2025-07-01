import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Application() {
  const { laptopId } = useParams();
  const { user } = useAuth();
  const [laptop, setLaptop] = useState(null);
  const [error, setError] = useState(null);
  const [year, setYear] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login');
      return;
    }

    if (user.year) {
      setYear(String(user.year)); // auto-fill year if available
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch(`http://localhost:5000/api/laptops/${laptopId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Laptop not found');
        return res.json();
      })
      .then(data => setLaptop(data))
      .catch(err => {
        console.error(err);
        setLaptop(null);
        setError('❌ Laptop not found or has been removed.');
      });
  }, [laptopId, navigate, user]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!year) {
      alert('❌ Please select your academic year.');
      return;
    }

    if (year === '4') {
      alert('❌ Final year students are not eligible to apply.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ Please log in first.');
      navigate('/login');
      return;
    }

    const applicationData = {
      laptopId,
    };

    fetch('http://localhost:5000/api/applications/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(applicationData),
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            throw new Error(err.message || 'Failed to submit application');
          });
        }
        return res.json();
      })
      .then(data => {
        alert('✅ Application submitted successfully!');
        navigate(`/mpesa-payment?laptopId=${laptopId}&price=${laptop.price}`);
      })
      .catch(err => {
        console.error('Application submission error:', err);
        alert(`❌ ${err.message || 'Failed to submit application. Try again later.'}`);
      });
  };

  return (
    <div style={{
      maxWidth: '90%',
      width: '800px',
      margin: '2rem auto',
      padding: '2rem',
      background: '#f8fafc',
      borderRadius: 12,
      border: '1px solid #cbd5e1',
      fontFamily: 'Segoe UI, sans-serif',
      boxShadow: '0 0 12px rgba(0, 0, 0, 0.05)'
    }}>
      <h2 style={{ fontSize: '1.8rem', color: '#1e40af', marginBottom: '1.5rem' }}>
        🎓 Laptop Application Form
      </h2>

      {error && (
        <div style={{
          background: '#fee2e2',
          padding: '0.8rem',
          color: '#b91c1c',
          borderRadius: '6px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {laptop && (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
              Laptop:
            </label>
            <input
              type="text"
              value={`${laptop.brand} ${laptop.model}`}
              readOnly
              style={{
                width: '100%',
                padding: '0.7rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: 'black'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.8rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
              Select Your Academic Year:
            </label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.7rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
              }}
            >
              <option value="">-- Select Year --</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year (Not Eligible)</option>
            </select>
          </div>

          <button type="submit" style={{
            background: '#10b981',
            color: '#ffffff',
            padding: '0.75rem 1.2rem',
            fontSize: '1.05rem',
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.2s ease'
          }}
            onMouseOver={e => e.currentTarget.style.background = '#059669'}
            onMouseOut={e => e.currentTarget.style.background = '#10b981'}>
            ✅ Submit Application and proceed to payment
          </button>
        </form>
      )}
    </div>
  );
}

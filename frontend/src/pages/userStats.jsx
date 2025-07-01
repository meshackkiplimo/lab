import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { Apidomain } from '../utils/ApiDomain';
import './userStats.css';

export default function UserStats() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [applicationsRes, paymentsRes] = await Promise.all([
          axios.get(`${Apidomain}/applications/user`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${Apidomain}/mpesa/user-payments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setApplications(applicationsRes.data);
        setPayments(paymentsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
      case 'failed':
        return '#ef4444';
      case 'success':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Welcome back, {user?.name}</h1>
        <p>Track your laptop applications and payments here</p>
      </div>

      {/* Applications Section */}
      <div className="section">
        <h2>Your Laptop Applications</h2>
        {applications.length === 0 ? (
          <div className="empty-state">
            <p>No applications found</p>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map((app) => (
              <div key={app._id} className="application-card">
                <div className="card-header">
                  <div>
                    <h3>{app.laptopDetails?.name || 'Laptop Application'}</h3>
                    <p className="date">Applied on {formatDate(app.createdAt)}</p>
                  </div>
                  <span 
                    className="status-badge"
                    style={{
                      backgroundColor: `${getStatusColor(app.status)}20`,
                      color: getStatusColor(app.status)
                    }}
                  >
                    {app.status}
                  </span>
                </div>
                <div className="card-details">
                  <p>Model: {app.laptopDetails?.model || 'N/A'}</p>
                  <p>Price: KES {app.laptopDetails?.price || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments Section */}
      <div className="section">
        <h2>Payment History</h2>
        {payments.length === 0 ? (
          <div className="empty-state">
            <p>No payments found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{formatDate(payment.createdAt)}</td>
                    <td>KES {payment.amount}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: `${getStatusColor(payment.status)}20`,
                          color: getStatusColor(payment.status)
                        }}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
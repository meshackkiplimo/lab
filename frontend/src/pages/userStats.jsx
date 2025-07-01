import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { Apidomain } from '../utils/ApiDomain';
import './userStats.css';
import jsPDF from "jspdf";

export default function UserStats() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
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

      // Extract available months from payments
      const months = Array.from(
        new Set(
          paymentsRes.data.map(p => {
            const d = new Date(p.createdAt);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          })
        )
      ).sort().reverse();
      setAvailableMonths(months);
      setSelectedMonth(months[0] || '');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  fetchUserData();
}, []);

  // --- Stats Aggregation ---
  const totalApplications = applications.length;
  const approvedApplications = applications.filter(app => app.status?.toLowerCase() === 'approved').length;
  const pendingApplications = applications.filter(app => app.status?.toLowerCase() === 'pending').length;
  const rejectedApplications = applications.filter(app => app.status?.toLowerCase() === 'rejected').length;
  // Filter payments by selected month
  const filteredPayments = selectedMonth
    ? payments.filter(p => {
        const d = new Date(p.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      })
    : payments;

  const totalPayments = filteredPayments.length;
  const totalAmountPaid = filteredPayments
    .filter(payment => payment.status?.toLowerCase() === 'success')
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

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

// Print receipt for a payment
const handlePrintReceipt = async (payment) => {
  const qrData = encodeURIComponent(`Transaction ID: ${payment._id}\nAmount: KES ${payment.amount}\nDate: ${new Date(payment.createdAt).toLocaleString()}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrData}`;
  // Fetch QR code as base64
  const qrImg = await fetch(qrUrl).then(res => res.blob()).then(blob => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  });

  // Create a slim PDF receipt
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [58, 90] // Slim receipt size
  });

  doc.setFontSize(13);
  doc.setTextColor(16, 185, 129);
  doc.text("Payment Receipt", 29, 10, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let y = 18;
  doc.text("Transaction ID:", 5, y);
  doc.text(String(payment._id), 25, y);
  y += 6;
  doc.text("Date:", 5, y);
  doc.text(new Date(payment.createdAt).toLocaleString(), 25, y);
  y += 6;
  doc.text("Amount:", 5, y);
  doc.text(`KES ${payment.amount}`, 25, y);
  y += 6;
  doc.text("Status:", 5, y);
  doc.text(String(payment.status), 25, y);
  y += 6;
  doc.text("Method:", 5, y);
  doc.text(String(payment.method), 25, y);

  // QR code
  y += 8;
  doc.setTextColor(120, 120, 120);
  doc.text("Scan for transaction", 29, y, { align: "center" });
  y += 2;
  doc.addImage(qrImg, "PNG", 19, y, 20, 20);

  y += 24;
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Thank you for your payment.", 29, y, { align: "center" });

  doc.save(`receipt_${payment._id}.pdf`);
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
      {/* --- Stats Cards Section --- */}
      <div className="stats-cards">
        <div className="stats-card stats-apps">
          <span className="stats-icon" role="img" aria-label="Applications">💻</span>
          <div>
            <div className="stats-value">{totalApplications}</div>
            <div className="stats-label">Total Applications</div>
          </div>
        </div>
        <div className="stats-card stats-approved">
          <span className="stats-icon" role="img" aria-label="Approved">✅</span>
          <div>
            <div className="stats-value">{approvedApplications}</div>
            <div className="stats-label">Approved</div>
          </div>
        </div>
        <div className="stats-card stats-pending">
          <span className="stats-icon" role="img" aria-label="Pending">⏳</span>
          <div>
            <div className="stats-value">{pendingApplications}</div>
            <div className="stats-label">Pending</div>
          </div>
        </div>
        <div className="stats-card stats-rejected">
          <span className="stats-icon" role="img" aria-label="Rejected">❌</span>
          <div>
            <div className="stats-value">{rejectedApplications}</div>
            <div className="stats-label">Rejected</div>
          </div>
        </div>
        <div className="stats-card stats-payments">
          <span className="stats-icon" role="img" aria-label="Payments">💰</span>
          <div>
            <div className="stats-value">{totalPayments}</div>
            <div className="stats-label">Payments</div>
          </div>
        </div>
        <div className="stats-card stats-amount">
          <span className="stats-icon" role="img" aria-label="Amount Paid">🪙</span>
          <div>
            <div className="stats-value">KES {totalAmountPaid.toLocaleString()}</div>
            <div className="stats-label">Total Paid</div>
          </div>
        </div>
      </div>
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
          <>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="month-select" style={{ marginRight: "0.5rem", fontWeight: 500 }}>
                Filter by Month:
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #d1d5db",
                  fontSize: "1rem"
                }}
              >
                {availableMonths.map(month => {
                  const [year, m] = month.split("-");
                  const date = new Date(year, m - 1);
                  return (
                    <option key={month} value={month}>
                      {date.toLocaleString("default", { month: "long" })} {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="table-wrapper">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
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
                      <td>
                        <button
                          className="receipt-btn"
                          onClick={() => handlePrintReceipt(payment)}
                          style={{
                            background: "#10b981",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.375rem",
                            padding: "0.4rem 1rem",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            transition: "background 0.2s"
                          }}
                        >
                          Download PDF Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

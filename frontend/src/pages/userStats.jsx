import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { Apidomain } from '../utils/ApiDomain';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './userStats.css';
import jsPDF from "jspdf";

export default function UserStats() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Set up polling for real-time updates
  const interval = setInterval(() => {
    fetchUserData();
  }, 5000); // Update every 5 seconds

  return () => clearInterval(interval);
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
  // Calculate totals using same logic as ManageInventory
  const totalAmountPaid = filteredPayments.reduce((sum, p) => {
    const amount = Number(p.amount || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  console.log('💰 Total Amount Paid:', totalAmountPaid);

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return '#10b981';
    case 'pending':
      return '#f59e0b';
    case 'rejected':
    case 'success':
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
  doc.text("success", 25, y);
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
      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stats-card stats-paid">
          <span className="stats-icon" role="img" aria-label="Amount Paid">💰</span>
          <div>
            <div className="stats-value">KES {totalAmountPaid.toLocaleString()}</div>
            <div className="stats-label">Total Amount Paid</div>
          </div>
        </div>

        <div className="stats-card stats-expected">
          <span className="stats-icon" role="img" aria-label="Expected">💵</span>
          <div>
            <div className="stats-value">
              KES {applications.reduce((sum, app) => sum + Number(app.laptopDetails?.price || 0), 0).toLocaleString()}
            </div>
            <div className="stats-label">Total Expected</div>
          </div>
        </div>

        <div className="stats-card stats-remaining">
          <span className="stats-icon" role="img" aria-label="Remaining">⏳</span>
          <div>
            <div className="stats-value">
              KES {Math.max(0, applications.reduce((sum, app) => {
                const price = Number(app.laptopDetails?.price || 0);
                const paid = payments
                  .filter(p => String(p.laptopId) === String(app.laptop?._id))
                  .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                return sum + Math.max(0, price - paid);
              }, 0)).toLocaleString()}
            </div>
            <div className="stats-label">Total Remaining</div>
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
            {applications.map((app) => {
              // Get payments for this laptop
              const laptopId = String(app.laptop?._id || app.laptop);
              const laptopPayments = payments
                .filter(p => {
                  // Handle both populated and unpopulated laptopId field
                  const paymentLaptopId = String(
                    p.laptopId?._id || // Populated laptopId
                    p.laptopId || // Raw ObjectId
                    p._doc?.laptopId // Mongoose document
                  );
                  const matches = paymentLaptopId === laptopId;
                  
                  console.log('Payment Check:', {
                    payment: p._id,
                    amount: p.amount,
                    paymentLaptopId,
                    targetLaptopId: laptopId,
                    matches
                  });
                  
                  return matches;
                });

              // Calculate total paid amount
              const price = Number(app.laptopDetails?.price || 0);
              const paid = laptopPayments.reduce((sum, p) => {
                const amount = Number(p.amount || 0);
                console.log('Adding payment amount:', amount);
                return sum + amount;
              }, 0);

              // Detailed logging for debugging
              console.log('Payment Summary:', {
                laptopId: app.laptop?._id,
                model: app.laptopDetails?.model,
                price,
                totalPayments: laptopPayments.length,
                paymentAmounts: laptopPayments.map(p => p.amount),
                totalPaid: paid,
                remaining: Math.max(0, price - paid)
              });

              const remaining = Math.max(0, price - paid);
              const ratio = price > 0 ? paid / price : 0;

              return (
                <div
                  key={app._id}
                  className="application-card"
                  style={{
                    position: "relative",
                    minHeight: "180px",
                    paddingBottom: "56px",
                    boxSizing: "border-box",
                  }}
                >
                  <div className="card-header">
                    <div>
                      <h3>{app.laptopDetails?.name || "Laptop Application"}</h3>
                      <p className="date">Applied on {formatDate(app.createdAt)}</p>
                    </div>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${getStatusColor(app.status)}20`,
                        color: getStatusColor(app.status),
                      }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className="card-details" style={{ marginBottom: "24px" }}>
                    <p>Model: {app.laptopDetails?.model || "N/A"}</p>
                    <p>Price: KES {app.laptopDetails?.price || "N/A"}</p>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      right: "18px",
                      bottom: "18px",
                      background: paid >= price ? '#22c55e' : '#dc2626',
                      color: '#ffffff',
                      borderRadius: "8px",
                      padding: "0.35rem 0.7rem",
                      fontSize: "0.93rem",
                      color: "#fff",
                      boxShadow: ratio >= 1
                        ? "0 2px 8px rgba(34,197,94,0.15)"
                        : ratio >= 0.5
                        ? "0 2px 8px rgba(245,158,11,0.15)"
                        : "0 2px 8px rgba(14,165,233,0.15)",
                      minWidth: "130px",
                      textAlign: "right",
                      zIndex: 2,
                      fontWeight: 500,
                      letterSpacing: "0.01em"
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', marginBottom: '2px', opacity: 0.9 }}>
                      Progress: {(ratio * 100).toFixed(0)}%
                    </div>
                    <div>
                      Paid: <span style={{ fontWeight: 700 }}>KES {paid.toLocaleString()}</span>
                    </div>
                    <div>
                      Remaining: <span style={{ fontWeight: 700 }}>KES {remaining.toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/mpesa-payment?laptopId=${app.laptop?._id || app.laptop}&price=${remaining}`)}
                    style={{
                      position: "absolute",
                      left: "18px",
                      bottom: "18px",
                      background: "#0284c7",
                      borderRadius: "8px",
                      padding: "0.35rem 0.7rem",
                      fontSize: "0.93rem",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(2,132,199,0.10)",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                      transition: "background-color 0.2s"
                    }}
                  >
                    Pay Again
                  </button>
                </div>
              );
            })}
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
                  {filteredPayments
                    .filter(payment =>
                      payment.status?.toLowerCase() !== "cancelled"
                    )
                    .map((payment) => (
                      <tr key={payment._id}>
                        <td>{formatDate(payment.createdAt)}</td>
                        <td>KES {payment.amount}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: "#22c55e",
                              color: "#fff"
                            }}
                          >
                            success
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

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apidomain } from '../utils/ApiDomain';
import './managepayment.css';

export default function AdminPaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      navigate(role ? '/' : '/login');
      return;
    }
    fetchPayments();
  }, [navigate]);

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${Apidomain}/mpesa/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      const res = await fetch(`${Apidomain}/mpesa/payments/${paymentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment');

      setPayments(prev => prev.filter(p => p._id !== paymentId));
      alert(data.message || 'Payment deleted');
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment');
    }
  };

  return (
    <div className="payments-container">
      <h1 className="payments-header">💵 M-Pesa Payments</h1>

      {loading ? (
        <p className="loading-text">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="no-data-text">No payments found.</p>
      ) : (
        <div className="payments-table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Laptop</th>
                <th>Amount Paid</th>
                <th>Total Price</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Checkout ID</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>
                    <span className="user-name">
                      {payment.userId?.firstName} {payment.userId?.lastName}
                    </span>
                  </td>
                  <td>
                    <span className="laptop-info">
                      {payment.laptopId?.brand} {payment.laptopId?.model}
                    </span>
                  </td>
                  <td>
                    <span className="amount">
                      KES {payment.amount}
                    </span>
                  </td>
                  <td>
                    <span className="amount">
                      KES {payment.totalPrice}
                    </span>
                  </td>
                  <td>
                    <span className="remaining-balance">
                      KES {payment.remainingBalance}
                    </span>
                  </td>
                  <td>
                    <span className="payment-status">
                      {payment.status}
                    </span>
                  </td>
                  <td>
                    <span className="checkout-id">
                      {payment.checkoutId}
                    </span>
                  </td>
                  <td>
                    <span className="payment-date">
                      {new Date(payment.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => deletePayment(payment._id)}
                      className="delete-payment-btn"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

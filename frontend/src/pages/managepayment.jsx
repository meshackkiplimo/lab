import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apidomain } from '../utils/ApiDomain';

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>💵 All M-Pesa Payments</h1>

      {loading ? (
        <p>Loading payments...</p>
      ) : payments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {payments.map((payment) => (
            <div
              key={payment._id}
              style={{
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
              }}
            >
              <p><strong>User:</strong> {payment.userId?.firstName} {payment.userId?.lastName}</p>
              <p><strong>Laptop:</strong> {payment.laptopId?.brand} {payment.laptopId?.model}</p>
              <p><strong>Amount Paid:</strong> KES {payment.amount}</p>
              <p><strong>Total Price:</strong> KES {payment.totalPrice}</p>
              <p><strong>Remaining Balance:</strong> KES {payment.remainingBalance}</p>
              <p><strong>Status:</strong> {payment.status}</p>
              <p><strong>Checkout ID:</strong> {payment.checkoutId}</p>
              <p><strong>Date:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
              <button
                onClick={() => deletePayment(payment._id)}
                style={{
                  marginTop: 8,
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 5,
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete Payment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

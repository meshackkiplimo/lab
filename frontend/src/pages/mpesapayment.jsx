import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { Apidomain } from '../utils/ApiDomain';

export default function MpesaPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, waiting, success, failed, cancelled
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const cancelPayment = async () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    try {
      const token = localStorage.getItem('token');
      const statusRes = await axios.get(`${Apidomain}/mpesa/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPaymentStatus('cancelled');
      setIsLoading(false);
      toast.success('Payment cancelled successfully');
    } catch (err) {
      toast.error('Error cancelling payment');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in first.');
      navigate('/login');
      return;
    }

    if (!phoneNumber) {
      toast.error('Phone number is required.');
      return;
    }

    if (!/^2547\d{8}$/.test(phoneNumber)) {
      toast.error('📱 Enter a valid phone number (e.g., 254712345678)');
      return;
    }

    try {
      setIsLoading(true);
      setPaymentStatus('waiting');
      const loadingToast = toast.loading('⏳ Sending STK push to your phone...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in first.');
        navigate('/login');
        return;
      }

      const res = await axios.post(
        `${Apidomain}/mpesa/initiate`,
        { phoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.dismiss(loadingToast);

      if (res.data.success) {
        toast.success('📲 STK Push sent! Please enter M-Pesa PIN on your phone');

        let attempts = 0;
        toast.loading('⏳ Checking payment status...', { duration: 120000 }); // Show for 2 minutes
        const maxAttempts = 24; // poll for 2 minutes (24 * 5s)

        const checkStatus = async () => {
          if (attempts >= maxAttempts) {
            setTimeoutId(null);
            setPaymentStatus('cancelled');
            setIsLoading(false);
            toast.error('⏰ Payment timeout. Please try again.');
            return;
          }

          attempts++;
          try {
            const statusRes = await axios.get(`${Apidomain}/mpesa/status`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            const status = statusRes.data.status;

            if (status === 'success') {
              setTimeoutId(null);
              setPaymentStatus('success');
              setIsLoading(false);
              toast.success('✅ Payment successful!');
              setTimeout(() => navigate('/dashboard'), 2000);
            } else if (status === 'failed' || status === 'cancelled') {
              setTimeoutId(null);
              setPaymentStatus(status);
              setIsLoading(false);
              toast.error(status === 'cancelled' ? '❌ Payment cancelled or timed out.' : '❌ Payment failed.');
            } else {
              // Schedule next check
              const newTimeoutId = setTimeout(checkStatus, 5000);
              setTimeoutId(newTimeoutId);
            }
          } catch (err) {
            setTimeoutId(null);
            setPaymentStatus('failed');
            setIsLoading(false);
            toast.error(`⚠️ Error checking payment status: ${err.message}`);
          }
        };

        // Start checking status
        const initialTimeoutId = setTimeout(checkStatus, 5000);
        setTimeoutId(initialTimeoutId);
      } else {
        setPaymentStatus('failed');
        setIsLoading(false);
        toast.error('❌ STK push failed. Try again.');
      }
    } catch (err) {
      setPaymentStatus('failed');
      setIsLoading(false);
      toast.error(`🚫 Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return '#10b981';
      case 'failed':
      case 'cancelled':
        return '#ef4444';
      case 'waiting':
        return '#f59e0b';
      default:
        return '#1e293b';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return '✅ Payment Successful! Redirecting...';
      case 'failed':
        return '❌ Payment Failed';
      case 'cancelled':
        return '❌ Payment Cancelled or Timed Out';
      case 'waiting':
        return '⏳ Waiting for M-Pesa confirmation...';
      default:
        return 'Pay KES 50,000 for Laptop';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f4f8',
        padding: '2rem',
      }}
    >
      <form
        onSubmit={handlePayment}
        style={{
          background: '#ffffff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '500px',
        }}
      >
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            color: '#2563eb',
            textAlign: 'center',
          }}
        >
          M-Pesa Payment
        </h2>

        <div
          style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: `1px solid ${getStatusColor()}`,
            color: getStatusColor(),
            textAlign: 'center',
            fontWeight: '600',
          }}
        >
          {getStatusMessage()}
        </div>

        <input
          type="text"
          placeholder="2547XXXXXXXX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={isLoading || paymentStatus === 'waiting' || paymentStatus === 'success'}
          style={{
            width: '100%',
            padding: '0.8rem',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '1rem',
            marginBottom: '1.2rem',
            opacity: isLoading ? '0.7' : '1',
          }}
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={isLoading || paymentStatus === 'waiting' || paymentStatus === 'success'}
            style={{
              flex: '1',
              padding: '0.9rem',
              backgroundColor: isLoading ? '#94a3b8' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
            }}
          >
            {isLoading ? 'Processing...' : 'Pay with M-Pesa'}
          </button>
          
          {(paymentStatus === 'waiting') && (
            <button
              type="button"
              onClick={cancelPayment}
              style={{
                flex: '1',
                padding: '0.9rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
            >
              Cancel Payment
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

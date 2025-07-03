import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/authcontext';
import { Apidomain } from '../utils/ApiDomain';
import './mpesapayment.css';

export default function MpesaPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [price, setPrice] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [laptopId, setLaptopId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const priceParam = Number(params.get('price'));
    const laptopIdParam = params.get('laptopId');
    if (!priceParam || !laptopIdParam) {
      navigate('/available-laptops');
      return;
    }
    setPrice(priceParam);
    setLaptopId(laptopIdParam);
    // Default to 10% but allow any amount up to remaining balance
    setMonthlyPayment(Math.min((priceParam * 10) / 100, priceParam));
  }, [navigate]);

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
    setPaymentStatus('cancelled');
    setIsLoading(false);
    toast.success('Payment request cancelled');
  };

  const checkPaymentStatus = async (token, attempts = 0) => {
    const maxAttempts = 30;
    if (attempts >= maxAttempts) {
      setTimeoutId(null);
      setPaymentStatus('cancelled');
      setIsLoading(false);
      toast.error('⏰ Payment timeout. Please try again.');
      return;
    }
    try {
      const statusRes = await axios.get(`${Apidomain}/mpesa/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { status, amount, checkoutId, mpesaReceiptNumber, description } = statusRes.data;
      setPaymentDetails({
        checkoutId,
        mpesaReceiptNumber,
        amount,
        description
      });
      if (status === 'success') {
        setTimeoutId(null);
        setPaymentStatus('success');
        setIsLoading(false);
        toast.success(`✅ Payment successful! Amount: KES ${amount} Receipt: ${mpesaReceiptNumber}`);
        setTimeout(() => navigate('/dashboard'), 3000);
      } else if (status === 'failed' || status === 'cancelled') {
        setTimeoutId(null);
        setPaymentStatus(status);
        setIsLoading(false);
        toast.error(description || (status === 'cancelled' ? '❌ Payment cancelled or timed out.' : '❌ Payment failed.'));
      } else {
        const delay = attempts < 10 ? 1000 : 3000;
        const newTimeoutId = setTimeout(() => checkPaymentStatus(token, attempts + 1), delay);
        setTimeoutId(newTimeoutId);
      }
    } catch (err) {
      const timestamp = new Date().toISOString();
      console.error(`❌ Status check error at ${timestamp}:`, err);
      if (err.response?.status === 404) {
        setTimeoutId(null);
        setPaymentStatus('failed');
        setIsLoading(false);
        toast.error('Payment record not found');
      } else {
        const newTimeoutId = setTimeout(() => checkPaymentStatus(token, attempts + 1), 3000);
        setTimeoutId(newTimeoutId);
      }
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
        {
          phoneNumber,
          laptopId,
          amount: monthlyPayment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.dismiss(loadingToast);
      if (res.data.success) {
        console.log('📲 STK Push successful, CheckoutRequestID:', res.data.data.CheckoutRequestID);
        toast.success('📲 Enter M-Pesa PIN on your phone. Status will update automatically.');
        checkPaymentStatus(token);
        setPaymentDetails({ 
          checkoutId: res.data.data.CheckoutRequestID,
          amount: monthlyPayment
        });
      } else {
        setPaymentStatus('failed');
        setIsLoading(false);
        toast.error('❌ STK push failed. Please try again.');
      }
    } catch (err) {
      setPaymentStatus('failed');
      setIsLoading(false);
      const timestamp = new Date().toISOString();
      console.error(`🚫 Payment error at ${timestamp}:`, err);
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
    if (paymentStatus === 'success' && paymentDetails?.mpesaReceiptNumber) {
      return `✅ Payment of KES ${paymentDetails.amount} Successful! Receipt: ${paymentDetails.mpesaReceiptNumber}`;
    }
    switch (paymentStatus) {
      case 'success':
        return '✅ Payment Successful! Redirecting...';
      case 'failed':
        return paymentDetails?.description || '❌ Payment Failed';
      case 'cancelled':
        return paymentDetails?.description || '❌ Payment Cancelled or Timed Out';
      case 'waiting':
        return '⏳ Waiting for M-Pesa confirmation...';
      default:
        return `Pay any amount up to KES ${price.toFixed(2)} (Suggested: KES ${monthlyPayment.toFixed(2)})`;
    }
  };

  return (
    <div className="mpesapayment-bg">
      <form
        onSubmit={handlePayment}
        className="mpesapayment-form"
      >
        <div className="mpesapayment-header">
          <div className="mpesapayment-header-icon">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#10b981" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 10.9 12 11.5 12 13h-2v-.5c0-.8.45-1.5 1.17-2.08l1.24-1.15A2 2 0 0012 7a2 2 0 00-2 2H8a4 4 0 018 0c0 1.1-.45 2.1-1.17 2.75z"></path></svg>
          </div>
          <div className="mpesapayment-title">Laptop Payment Plan</div>
          <div className="mpesapayment-subtitle">Pay with M-Pesa in a few easy steps</div>
        </div>
        {/* Step Indicator */}
        <div className="mpesapayment-stepper">
          <div className={`mpesapayment-step-dot${paymentStatus === 'idle' ? ' active' : ''}`}></div>
          <div className={`mpesapayment-step-bar${paymentStatus === 'waiting' ? ' active' : ''}`}></div>
          <div className={`mpesapayment-step-dot${paymentStatus === 'waiting' ? ' waiting' : paymentStatus === 'success' ? ' active' : ''}`}></div>
          <div className={`mpesapayment-step-bar${paymentStatus === 'success' ? ' active' : ''}`}></div>
          <div className={`mpesapayment-step-dot${paymentStatus === 'success' ? ' active' : paymentStatus === 'failed' ? ' failed' : ''}`}></div>
        </div>
        <div
          className={
            "mpesapayment-status" +
            (paymentStatus === 'success'
              ? ' success'
              : paymentStatus === 'failed' || paymentStatus === 'cancelled'
              ? ' failed'
              : paymentStatus === 'waiting'
              ? ' waiting'
              : '')
          }
        >
          <div className="icon">
            {paymentStatus === 'success' && (
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#10b981"/><path d="M8 12.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            {paymentStatus === 'failed' && (
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/><path d="M9 9l6 6M15 9l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            )}
            {paymentStatus === 'waiting' && (
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f59e0b"/><path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            )}
            {paymentStatus === 'idle' && (
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><path d="M12 8v4h4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
            )}
          </div>
          {getStatusMessage()}
        </div>
        <div className="mpesapayment-summary">
          <div className="mpesapayment-summary-row">
            <span className="label">Total Price:</span>
            <span className="value">KES {price.toFixed(2)}</span>
          </div>
          <div className="mpesapayment-summary-row">
            <span className="label">Monthly Payment (10%):</span>
            <span className="value green">KES {monthlyPayment.toFixed(2)}</span>
          </div>
        </div>
        {paymentDetails?.checkoutId && (
          <div className="mpesapayment-transaction">
            Transaction ID: {paymentDetails.checkoutId}
          </div>
        )}
        <input
          type="text"
          placeholder="2547XXXXXXXX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={isLoading || paymentStatus === 'waiting' || paymentStatus === 'success'}
          className="mpesapayment-input"
          style={{
            opacity: isLoading ? '0.7' : '1'
          }}
        />
        <div className="mpesapayment-actions">
          <button
            type="submit"
            disabled={isLoading || paymentStatus === 'waiting' || paymentStatus === 'success'}
            className="mpesapayment-btn"
          >
            {isLoading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <svg style={{ animation: "spin 1s linear infinite" }} width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4" opacity="0.2"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>
                Processing...
              </span>
            ) : 'Pay with M-Pesa'}
          </button>
          {(paymentStatus === 'waiting') && (
            <button
              type="button"
              onClick={cancelPayment}
              className="mpesapayment-btn cancel"
            >
              Cancel Payment
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

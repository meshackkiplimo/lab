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
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [price, setPrice] = useState(0);
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const priceParam = Number(params.get('price'));
    if (!priceParam) {
      navigate('/available-laptops');
      return;
    }

    setPrice(priceParam);
    // Calculate monthly payment (10% of price)
    setMonthlyPayment((priceParam * 10) / 100);
  }, [navigate]);

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
    
    setPaymentStatus('cancelled');
    setIsLoading(false);
    toast.success('Payment request cancelled');
  };

  const checkPaymentStatus = async (token, attempts = 0) => {
    const maxAttempts = 20; // 1 minute (20 * 3s)

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

      const { status, checkoutId, mpesaReceiptNumber, description } = statusRes.data;

      setPaymentDetails({
        checkoutId,
        mpesaReceiptNumber,
        description
      });

      if (status === 'success') {
        setTimeoutId(null);
        setPaymentStatus('success');
        setIsLoading(false);
        toast.success(`✅ Payment successful! Receipt: ${mpesaReceiptNumber}`);
        setTimeout(() => navigate('/dashboard'), 3000);
      } else if (status === 'failed' || status === 'cancelled') {
        setTimeoutId(null);
        setPaymentStatus(status);
        setIsLoading(false);
        toast.error(description || (status === 'cancelled' ? '❌ Payment cancelled or timed out.' : '❌ Payment failed.'));
      } else {
        // Schedule next check
        // Poll more frequently (every 3 seconds)
        const newTimeoutId = setTimeout(() => checkPaymentStatus(token, attempts + 1), 3000);
        setTimeoutId(newTimeoutId);
      }
    } catch (err) {
      console.error('Status check error:', err);
      if (err.response?.status === 404) {
        setTimeoutId(null);
        setPaymentStatus('failed');
        setIsLoading(false);
        toast.error('Payment record not found');
      } else {
        // On error, continue polling unless max attempts reached
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

      const params = new URLSearchParams(window.location.search);
      const laptopId = params.get('laptopId');
      if (!laptopId) {
        toast.error('Laptop ID is required');
        navigate('/available-laptops');
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
        toast.success('📲 STK Push sent! Please enter M-Pesa PIN on your phone');
        setPaymentDetails({ checkoutId: res.data.data.CheckoutRequestID });

        // Start status checking after a brief delay
        // Start checking sooner (after 2 seconds)
        const initialTimeoutId = setTimeout(() => checkPaymentStatus(token), 2000);
        setTimeoutId(initialTimeoutId);
      } else {
        setPaymentStatus('failed');
        setIsLoading(false);
        toast.error('❌ STK push failed. Please try again.');
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
    if (paymentStatus === 'success' && paymentDetails?.mpesaReceiptNumber) {
      return `✅ Payment Successful! Receipt: ${paymentDetails.mpesaReceiptNumber}`;
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
        return `Pay KES ${monthlyPayment.toFixed(2)} (10% of ${price})`;
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <form 
        onSubmit={handlePayment}
        className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-6 text-blue-600 text-center">
          Laptop Payment Plan
        </h2>

        <div
          className="p-4 mb-6 rounded-lg text-center font-semibold"
          style={{
            backgroundColor: '#f8fafc',
            border: `1px solid ${getStatusColor()}`,
            color: getStatusColor(),
          }}
        >
          {getStatusMessage()}
        </div>

        <div className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between px-4 py-2 bg-gray-50 rounded">
            <span>Total Price:</span>
            <span className="font-medium">KES {price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-4 py-2 bg-gray-50 rounded">
            <span>Monthly Payment (10%):</span>
            <span className="font-medium">KES {monthlyPayment.toFixed(2)}</span>
          </div>
        </div>

        {paymentDetails?.checkoutId && (
          <div className="mb-4 text-sm text-gray-600 text-center">
            Transaction ID: {paymentDetails.checkoutId}
          </div>
        )}

        <input
          type="text"
          placeholder="2547XXXXXXXX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={isLoading || paymentStatus === 'waiting' || paymentStatus === 'success'}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            opacity: isLoading ? '0.7' : '1',
          }}
        />

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading || paymentStatus === 'waiting' || paymentStatus === 'success'}
            className="flex-1 py-3 px-4 bg-green-500 text-white font-semibold rounded-lg disabled:bg-gray-400 hover:bg-green-600 transition-colors"
          >
            {isLoading ? 'Processing...' : 'Pay with M-Pesa'}
          </button>
          
          {(paymentStatus === 'waiting') && (
            <button
              type="button"
              onClick={cancelPayment}
              className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              Cancel Payment
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

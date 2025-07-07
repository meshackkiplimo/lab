import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Apidomain } from '../utils/ApiDomain';
import toast from 'react-hot-toast';
import './additionalPayment.css';

const AdditionalPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    amount: ''
  });
  const [laptop, setLaptop] = useState(null);
  const [remainingBalance, setRemainingBalance] = useState(0);

  const laptopId = searchParams.get('laptopId');

  useEffect(() => {
    const fetchLaptopDetails = async () => {
      try {
        const response = await axios.get(`${Apidomain}/mpesa/laptop-payment-details/${laptopId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        setLaptop(response.data);
        setRemainingBalance(response.data.remainingBalance);
      } catch (error) {
        console.error('Error fetching laptop details:', error);
        toast.error(error.response?.data?.error || 'Error fetching laptop details');
      }
    };

    if (laptopId) {
      fetchLaptopDetails();
    }
  }, [laptopId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = Number(formData.amount);
      if (isNaN(amount) || amount < 1) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (amount > remainingBalance) {
        toast.error(`Amount cannot exceed remaining balance of KES ${remainingBalance}`);
        return;
      }

      const phoneNumber = formData.phoneNumber.replace(/\D/g, '');
      if (phoneNumber.length !== 10 && phoneNumber.length !== 12) {
        toast.error('Please enter a valid phone number');
        return;
      }

      const response = await axios.post(
        `${Apidomain}/mpesa/initiate`,
        {
          phoneNumber,
          amount: Math.ceil(amount),
          laptopId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Payment initiated');

        const checkStatus = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${Apidomain}/mpesa/status`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (statusRes.data.status === 'success') {
              clearInterval(checkStatus);
              toast.success('Payment successful');
              navigate('/user-stats');
            } else if (statusRes.data.status === 'failed') {
              clearInterval(checkStatus);
              toast.error('Payment failed');
            }
          } catch (err) {
            console.error('Status check error:', err);
          }
        }, 5000);

        setTimeout(() => {
          clearInterval(checkStatus);
        }, 120000);
      } else {
        toast.error(response.data.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h2>Make Payment</h2>
          <p>Enter your payment details below</p>
        </div>

        {laptop && (
          <div className="laptop-details">
            <h3>Laptop Details</h3>
            <div className="laptop-info">
              <div className="info-item">
                <label>Model</label>
                <span>{laptop.model}</span>
              </div>
              <div className="info-item">
                <label>Brand</label>
                <span>{laptop.brand}</span>
              </div>
              <div className="info-item">
                <label>Total Price</label>
                <span>KES {laptop.totalPrice?.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <label>Remaining</label>
                <span>KES {remainingBalance?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <form className="payment-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phoneNumber"
              type="tel"
              required
              placeholder="Enter M-Pesa number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (KES)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              required
              min="1"
              max={remainingBalance}
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pay-button"
          >
            {loading ? 'Processing...' : 'Pay with M-Pesa'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdditionalPayment;
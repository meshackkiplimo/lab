const Payment = require('../models/payment');
const MpesaService = require('../services/mpesaService');

class MpesaController {
  static async initiatePayment(req, res) {
    const { phoneNumber, laptopId, amount } = req.body;

    if (!phoneNumber || !laptopId || !amount) {
      return res.status(400).json({ success: false, error: 'Phone number, laptop ID, and amount are required' });
    }

    try {
      // Get laptop price and check existing payments
      const laptop = await require('../models/laptop').findById(laptopId);
      if (!laptop) {
        return res.status(404).json({ success: false, error: 'Laptop not found' });
      }

      // Get latest payment to check remaining balance
      const lastPayment = await Payment.findOne({
        userId: req.user.id,
        laptopId: laptopId
      }).sort({ createdAt: -1 });

      const totalPrice = laptop.price;
      const paymentAmount = Number(amount);
      const currentRemaining = lastPayment ? lastPayment.remainingBalance : totalPrice;

      console.log('💰 Payment request:', {
        totalPrice,
        paymentAmount,
        currentRemaining,
        userId: req.user.id,
        laptopId
      });

      if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment amount'
        });
      }

      if (paymentAmount > currentRemaining) {
        return res.status(400).json({
          success: false,
          error: `Payment amount ${paymentAmount} cannot exceed remaining balance ${currentRemaining}`
        });
      }

      // Calculate new remaining balance
      const newRemaining = Math.max(0, currentRemaining - paymentAmount);

      console.log('🚀 Initiating STK push:', {
        amount: paymentAmount,
        phone: phoneNumber
      });

      // Initiate M-Pesa payment
      const response = await MpesaService.initiateStkPush(
        phoneNumber,
        paymentAmount,
        'Laptop Payment'
      );

      console.log('✅ STK push successful:', response);

      // Create payment record
      const payment = new Payment({
        userId: req.user.id,
        laptopId: laptopId,
        totalPrice: totalPrice,
        remainingBalance: newRemaining,
        amount: paymentAmount,
        method: 'Mpesa',
        status: 'pending',
        checkoutId: response.CheckoutRequestID,
        mpesaResultDesc: `Payment of KES ${paymentAmount}, remaining balance KES ${newRemaining}`
      });

      console.log('💾 Saving payment record:', {
        userId: req.user.id,
        amount: paymentAmount,
        remaining: newRemaining,
        checkoutId: response.CheckoutRequestID
      });

      await payment.save();

      console.log('✅ Payment saved:', {
        id: payment._id,
        amount: paymentAmount,
        remaining: newRemaining
      });

      return res.status(200).json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('❌ Payment error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async handleCallback(req, res) {
    try {
      console.log('🔥 M-Pesa callback:', {
        timestamp: new Date().toISOString(),
        body: req.body
      });
      
      const stkCallback = req.body?.Body?.stkCallback;
      if (!stkCallback) {
        const payment = await Payment.findOne().sort({ createdAt: -1 });
        if (payment) {
          payment.status = 'success';
          await payment.save();
          console.log('✅ Payment status updated to success');
        }
        return res.status(200).json({
          message: 'Payment recorded successfully',
          amount: payment?.amount || 0
        });
      }

      const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

      if (!CheckoutRequestID) {
        return res.status(400).json({ message: 'Missing CheckoutRequestID' });
      }

      // Find and update payment status
      const payment = await Payment.findOne({ checkoutId: CheckoutRequestID });
      if (!payment) {
        return res.status(200).json({ message: 'No matching payment found' });
      }

      payment.status = ResultCode === 0 ? 'success' : 'failed';
      payment.mpesaResultCode = ResultCode;
      payment.mpesaResultDesc = ResultDesc;

      await payment.save();
      console.log('✅ Payment updated:', {
        checkoutId: CheckoutRequestID,
        status: payment.status,
        amount: payment.amount
      });

      return res.status(200).json({
        message: 'Payment processed',
        status: payment.status,
        amount: payment.amount
      });

    } catch (err) {
      console.error('❌ Callback error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  static async checkPaymentStatus(req, res) {
    try {
      const payment = await Payment.findOne({ userId: req.user.id })
        .sort({ createdAt: -1 });

      if (!payment) {
        return res.status(404).json({ status: 'not_found' });
      }

      return res.status(200).json({
        status: payment.status,
        amount: payment.amount,
        remaining: payment.remainingBalance,
        checkoutId: payment.checkoutId,
        description: payment.mpesaResultDesc
      });

    } catch (error) {
      console.error('❌ Status check error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAllPayments(req, res) {
    try {
      const payments = await Payment.find()
        .sort({ createdAt: -1 })
        .populate('laptopId', 'model brand price')
        .populate('userId', 'firstName lastName email');

      // Process and validate payment amounts
      const processedPayments = payments.map(payment => {
        const data = payment.toObject();
        return {
          ...data,
          amount: Number(data.amount || 0),
          totalPrice: Number(data.totalPrice || 0),
          remainingBalance: Number(data.remainingBalance || 0)
        };
      });

      console.log('💰 All payments:', processedPayments.map(p => ({
        id: p._id,
        amount: p.amount,
        laptop: p.laptopId?.model,
        user: `${p.userId?.firstName} ${p.userId?.lastName}`,
        date: p.createdAt
      })));

      return res.status(200).json(processedPayments);

    } catch (error) {
      console.error('❌ Error fetching all payments:', error);
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }
  }

  static async getUserPayments(req, res) {
    try {
      const payments = await Payment.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .populate('laptopId', 'model brand price');

      const processedPayments = payments.map(payment => {
        const data = payment.toObject();
        return {
          ...data,
          amount: Number(data.amount || 0),
          totalPrice: Number(data.totalPrice || 0),
          remainingBalance: Number(data.remainingBalance || 0)
        };
      });

      return res.status(200).json(processedPayments);
    } catch (error) {
      console.error('❌ Error fetching user payments:', error);
      return res.status(500).json({ error: 'Failed to fetch payment history' });
    }
  }

  static async getLaptopPaymentDetails(req, res) {
    try {
      const { laptopId } = req.params;

      const laptop = await require('../models/laptop').findById(laptopId);
      if (!laptop) {
        return res.status(404).json({ error: 'Laptop not found' });
      }

      const lastPayment = await Payment.findOne({
        userId: req.user.id,
        laptopId: laptopId
      }).sort({ createdAt: -1 });

      const totalPrice = laptop.price;
      const remainingBalance = lastPayment ? lastPayment.remainingBalance : totalPrice;
      const suggestedPayment = Math.min((remainingBalance * 10) / 100, remainingBalance);

      return res.status(200).json({
        totalPrice,
        remainingBalance,
        suggestedPayment,
        model: laptop.model,
        brand: laptop.brand
      });

    } catch (error) {
      console.error('❌ Error getting payment details:', error);
      return res.status(500).json({ error: 'Failed to get payment details' });
    }
  }
}

module.exports = MpesaController;

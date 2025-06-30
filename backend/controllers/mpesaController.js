const Payment = require('../models/payment');
const MpesaService = require('../services/mpesaService');

class MpesaController {
  // 1. Initiate STK Push
  static async initiatePayment(req, res) {
    const { phoneNumber } = req.body;
    const fixedAmount = 1; // KES
    const transactionDesc = 'Payment for laptop';

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    try {
      console.log('Initiating payment with:', { phoneNumber, fixedAmount, transactionDesc });
      const response = await MpesaService.initiateStkPush(phoneNumber, fixedAmount, transactionDesc);

      const payment = new Payment({
        userId: req.user.id,
        amount: fixedAmount,
        method: 'Mpesa',
        status: 'pending',
        checkoutId: response.CheckoutRequestID, // store this for matching in callback
      });

      await payment.save();
      console.log('✅ Payment created:', payment);

      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error('❌ Payment initiation error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // 2. Handle M-Pesa Callback from Safaricom
  static async handleCallback(req, res) {
    const result = req.body?.Body?.stkCallback;
    console.log('🔥 M-Pesa Callback hit:', JSON.stringify(result, null, 2));

    if (!result) {
      return res.status(400).json({ message: 'Invalid callback data' });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = result;
    const status = ResultCode === 0 ? 'success' : 'failed';

    try {
      const updated = await Payment.findOneAndUpdate(
        { checkoutId: CheckoutRequestID },
        { status },
        { new: true }
      );

      if (updated) {
        console.log(`✅ Payment updated. Status: ${status}`);
      } else {
        console.warn(`⚠️ No matching payment found for CheckoutRequestID: ${CheckoutRequestID}`);
      }

      return res.status(200).json({ message: 'Callback received successfully' });
    } catch (err) {
      console.error('❌ Error handling callback:', err.message);
      return res.status(500).json({ message: 'Error processing callback' });
    }
  }

  // 3. Check Payment Status (Frontend polling hits this)
  static async checkPaymentStatus(req, res) {
    try {
      const payment = await Payment.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

      if (!payment) {
        return res.status(404).json({ status: 'not_found' });
      }

      return res.status(200).json({ status: payment.status }); // 'pending', 'success', or 'failed'
    } catch (error) {
      console.error('❌ Error checking payment status:', error.message);
      return res.status(500).json({ status: 'error', error: error.message });
    }
  }
}

module.exports = MpesaController;

const Payment = require('../models/payment');
const MpesaService = require('../services/mpesaService');

class MpesaController {
  static async initiatePayment(req, res) {
    const { phoneNumber } = req.body;
    const fixedAmount = 1; // Fixed price for the laptop in KES
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
      });
      await payment.save();
      console.log('Payment initiation response:', response);
      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error('Payment initiation error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async handleCallback(req, res) {
    const callbackData = req.body;
    console.log('M-Pesa Callback:', callbackData);

    const result = callbackData.Body?.stkCallback;
    if (result?.ResultCode === 0) {
      console.log('Transaction successful:', result);
    } else {
      console.log('Transaction failed:', result?.ResultDesc);
    }

    return res.status(200).json({ status: 'Callback received' });
  }
}

module.exports = MpesaController;
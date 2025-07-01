const Payment = require('../models/payment');
const MpesaService = require('../services/mpesaService');

class MpesaController {
  // 1. Initiate STK Push
  static async initiatePayment(req, res) {
    const { phoneNumber, laptopId } = req.body;

    if (!phoneNumber || !laptopId) {
      return res.status(400).json({ success: false, error: 'Phone number and laptop ID are required' });
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
        laptopId: laptopId,
        status: 'success'
      }).sort({ createdAt: -1 });

      const totalPrice = laptop.price;
      const remainingBalance = lastPayment ? lastPayment.remainingBalance : totalPrice;
      const monthlyPayment = (remainingBalance * 10) / 100; // 10% of remaining balance

      console.log('💰 Initiating payment with:', {
        phoneNumber,
        amount: monthlyPayment,
        remainingBalance,
        totalPrice,
        callbackUrl: process.env.MPESA_CALLBACK_URL,
        timestamp: new Date().toISOString()
      });

      const response = await MpesaService.initiateStkPush(
        phoneNumber,
        monthlyPayment,
        'Monthly laptop payment'
      );

      // Store the payment record
      const payment = new Payment({
        userId: req.user.id,
        laptopId: laptopId,
        totalPrice: totalPrice,
        remainingBalance: remainingBalance,
        amount: monthlyPayment,
        method: 'Mpesa',
        status: 'pending',
        checkoutId: response.CheckoutRequestID,
        mpesaResultDesc: 'Pending STK push confirmation'
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
    try {
      const timestamp = new Date().toISOString();
      // Log full request details
      console.log('🔥 M-Pesa Callback received:', {
        timestamp,
        body: req.body,
        headers: req.headers,
        url: req.url,
        method: req.method
      });
      
      // Handle the nested structure
      const stkCallback = req.body?.Body?.stkCallback;
      if (!stkCallback) {
        console.error('Invalid callback data:', {
          timestamp,
          body: req.body,
          error: 'Missing Body.stkCallback'
        });
        // Always return 200 to M-Pesa to prevent retries
        return res.status(200).json({ message: 'Callback received but invalid structure' });
      }

      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
      } = stkCallback;

      if (!CheckoutRequestID) {
        console.error('Invalid callback data - missing CheckoutRequestID:', stkCallback);
        return res.status(400).json({ message: 'Missing CheckoutRequestID' });
      }

      // Map ResultCode to appropriate status
      let status;
      if (ResultCode === 0) {
        status = 'success';
      } else if (ResultCode === 1032) { // User cancelled
        status = 'cancelled';
      } else {
        status = 'failed';
      }

      console.log(`📊 M-Pesa Result: Code=${ResultCode}, Desc=${ResultDesc}, Status=${status}`);

      // Find and update the payment
      const payment = await Payment.findOne({ checkoutId: CheckoutRequestID });
      
      if (!payment) {
        console.warn(`⚠️ No matching payment found for CheckoutRequestID: ${CheckoutRequestID}`);
        return res.status(200).json({ message: 'Callback received but no matching payment found' });
      }

      // Update payment status and remaining balance
      payment.status = status;
      payment.mpesaResultCode = ResultCode;
      payment.mpesaResultDesc = ResultDesc;

      if (status === 'success') {
        // Update remaining balance after successful payment
        const newBalance = payment.remainingBalance - payment.amount;
        payment.remainingBalance = Math.max(0, newBalance); // Ensure it doesn't go below 0
      }

      // Extract transaction details if successful
      if (status === 'success' && CallbackMetadata?.Item) {
        const items = CallbackMetadata.Item;
        const receiptNumber = items.find(item => item.Name === 'MpesaReceiptNumber');
        const transactionDate = items.find(item => item.Name === 'TransactionDate');

        if (receiptNumber) {
          payment.mpesaReceiptNumber = receiptNumber.Value;
        }
        if (transactionDate) {
          payment.transactionDate = transactionDate.Value.toString();
        }

        console.log('💰 Transaction details:', {
          receipt: payment.mpesaReceiptNumber,
          date: payment.transactionDate
        });
      }

      await payment.save();
      const logData = {
        timestamp,
        checkoutId: CheckoutRequestID,
        status,
        desc: ResultDesc,
        receipt: payment.mpesaReceiptNumber,
        resultCode: ResultCode
      };
      console.log(`✅ Payment processed:`, logData);

      // Always return 200 to M-Pesa
      return res.status(200).json({
        message: 'Callback processed successfully',
        ...logData
      });
    } catch (err) {
      console.error('❌ Error handling callback:', err);
      return res.status(500).json({ message: 'Error processing callback', error: err.message });
    }
  }

  // 3. Check Payment Status (Frontend polling hits this)
  static async checkPaymentStatus(req, res) {
    try {
      const payment = await Payment.findOne({
        userId: req.user.id,
        status: { $in: ['pending', 'success', 'failed', 'cancelled'] }
      })
      .sort({ createdAt: -1 });

      if (!payment) {
        return res.status(404).json({ status: 'not_found' });
      }

      // For pending payments, always check with Safaricom
      if (payment.status === 'pending') {
        try {
          console.log('🔄 Checking status with Safaricom for:', payment.checkoutId);
          const result = await MpesaService.queryTransactionStatus(payment.checkoutId);
          console.log('📊 Status check result:', result);
          
          // Handle different M-Pesa result codes
          switch (result.ResultCode) {
            case 0: // Success
              payment.status = 'success';
              payment.mpesaResultDesc = 'Payment completed successfully';
              const newBalance = payment.remainingBalance - payment.amount;
              payment.remainingBalance = Math.max(0, newBalance);
              console.log('✅ Payment successful');
              break;

            case 1032: // User cancelled on phone
              payment.status = 'cancelled';
              payment.mpesaResultDesc = 'Transaction cancelled by user';
              console.log('❌ User cancelled payment');
              break;

            case 1037: // User cannot be reached/timeout
              payment.status = 'cancelled';
              payment.mpesaResultDesc = 'Payment cancelled - user not reachable';
              console.log('❌ User not reachable/timeout');
              break;

            default:
              // For other codes, check if transaction is too old
              const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
              if (payment.createdAt < twentySecondsAgo) {
                payment.status = 'cancelled';
                payment.mpesaResultDesc = 'Transaction timed out';
                console.log('⌛ Transaction timed out');
              } else {
                console.log('⏳ Transaction still processing');
              }
          }
          
          if (payment.isModified()) {
            await payment.save();
            console.log('💾 Payment updated:', {
              status: payment.status,
              desc: payment.mpesaResultDesc,
              code: result.ResultCode
            });
          }
        } catch (error) {
          console.error('Error querying M-Pesa status:', error);
          // Check for timeout even if query fails
          const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
          if (payment.createdAt < twentySecondsAgo) {
            payment.status = 'cancelled';
            payment.mpesaResultDesc = 'Transaction timed out';
            await payment.save();
          }
        }
      }

      // Return updated status
      return res.status(200).json({
        status: payment.status,
        checkoutId: payment.checkoutId,
        mpesaReceiptNumber: payment.mpesaReceiptNumber,
        description: payment.mpesaResultDesc || ''
      });
    } catch (error) {
      console.error('❌ Error checking payment status:', error.message);
      return res.status(500).json({ status: 'error', error: error.message });
    }
  }

  // Get user's payment history
  static async getUserPayments(req, res) {
    try {
      const payments = await Payment.find({ userId: req.user.id })
        .sort({ createdAt: -1 });

      return res.status(200).json(payments);
    } catch (error) {
      console.error('❌ Error fetching user payments:', error.message);
      return res.status(500).json({ error: 'Error fetching payment history' });
    }
  }

  // Get laptop payment details
  static async getLaptopPaymentDetails(req, res) {
    try {
      const { laptopId } = req.params;

      // Get laptop details
      const laptop = await require('../models/laptop').findById(laptopId);
      if (!laptop) {
        return res.status(404).json({ error: 'Laptop not found' });
      }

      // Get latest payment to calculate remaining balance
      const lastPayment = await Payment.findOne({
        userId: req.user.id,
        laptopId: laptopId,
        status: 'success'
      }).sort({ createdAt: -1 });

      const totalPrice = laptop.price;
      const remainingBalance = lastPayment ? lastPayment.remainingBalance : totalPrice;
      const monthlyPercentage = 10;
      const monthlyPayment = (remainingBalance * monthlyPercentage) / 100;

      return res.status(200).json({
        totalPrice,
        remainingBalance,
        monthlyPercentage,
        monthlyPayment,
        model: laptop.model,
        brand: laptop.brand
      });

    } catch (error) {
      console.error('Error getting laptop payment details:', error);
      return res.status(500).json({ error: 'Failed to get payment details' });
    }
  }
}

module.exports = MpesaController;

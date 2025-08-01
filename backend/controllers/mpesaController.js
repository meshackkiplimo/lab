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

      // Start periodic status checks
      let attempts = 0;
      const maxAttempts = 6; // Check for 3 minutes (30 seconds * 6)
      const checkStatus = async () => {
        try {
          if (attempts >= maxAttempts) {
            const payment = await Payment.findOne({ checkoutId: response.CheckoutRequestID });
            if (payment && payment.status === 'pending') {
              payment.status = 'failed';
              payment.mpesaResultDesc = 'Transaction timed out';
              await payment.save();
            }
            return;
          }

          const statusResponse = await MpesaService.queryTransactionStatus(response.CheckoutRequestID);
          
          const payment = await Payment.findOne({ checkoutId: response.CheckoutRequestID });
          if (!payment) return;

          // Check for success conditions
          const isSuccess =
            statusResponse.ResultCode === 0 ||
            statusResponse.ResultDesc === "The service request is processed successfully";

          if (isSuccess) {
            payment.status = 'success';
            payment.mpesaResultDesc = "Payment processed successfully";
            await payment.save();
            
            console.log('✅ Payment status updated to success:', {
              checkoutId: response.CheckoutRequestID,
              amount: payment.amount,
              mpesaResultDesc: payment.mpesaResultDesc
            });

            // Check if this is the first payment for this laptop and send email
            try {
              const previousPayments = await Payment.find({
                userId: payment.userId,
                laptopId: payment.laptopId,
                status: 'success',
                _id: { $ne: payment._id }
              });

              if (previousPayments.length === 0) {
                // This is the first payment - send email notification
                console.log('🎯 Detected first payment, sending email notification...');
                
                const user = await require('../models/User').findById(payment.userId);
                const laptop = await require('../models/laptop').findById(payment.laptopId);
                
                if (user && laptop && global.emailService) {
                  await global.emailService.sendPaymentReminderEmail(user.email, {
                    userName: `${user.firstName} ${user.lastName}`,
                    laptopModel: laptop.model,
                    laptopBrand: laptop.brand,
                    totalPrice: payment.totalPrice,
                    amountPaid: payment.amount,
                    remainingBalance: payment.remainingBalance,
                    paymentDate: payment.createdAt || new Date()
                  });
                  
                  console.log('📧 First payment email notification sent to:', user.email);
                }
              }
            } catch (emailError) {
              console.error('❌ Error sending first payment email:', emailError);
            }

            // Emit real-time payment success notification
            if (global.notificationService && payment.userId) {
              try {
                const laptop = await require('../models/laptop').findById(payment.laptopId);
                await global.notificationService.emitPaymentSuccess(payment.userId, {
                  _id: payment._id,
                  amount: payment.amount,
                  laptopModel: laptop ? `${laptop.brand} ${laptop.model}` : 'laptop',
                  remainingBalance: payment.remainingBalance,
                  mpesaReceiptNumber: payment.mpesaReceiptNumber
                });
              } catch (notifyError) {
                console.error('❌ Error sending payment success notification:', notifyError);
              }
            }
            return;
          } else if (statusResponse.ResultCode !== undefined) {
            // Only mark as failed if we get a clear failure response
            payment.status = 'failed';
            payment.mpesaResultDesc = statusResponse.ResultDesc || 'Payment failed';
            await payment.save();

            // Emit real-time payment failed notification
            if (global.notificationService && payment.userId) {
              try {
                const laptop = await require('../models/laptop').findById(payment.laptopId);
                await global.notificationService.emitPaymentFailed(payment.userId, {
                  _id: payment._id,
                  amount: payment.amount,
                  laptopModel: laptop ? `${laptop.brand} ${laptop.model}` : 'laptop',
                  reason: statusResponse.ResultDesc || 'Payment failed'
                });
              } catch (notifyError) {
                console.error('❌ Error sending payment failed notification:', notifyError);
              }
            }
            return;
          }

          attempts++;
          setTimeout(checkStatus, 30000); // Check every 30 seconds
        } catch (error) {
          console.error('Status check error:', error);
        }
      };

      setTimeout(checkStatus, 30000); // Start first check after 30 seconds

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

      // Send payment initiation email immediately (regardless of M-Pesa result)
      try {
        if (global.emailService) {
          const user = await require('../models/User').findById(req.user.id);
          
          if (user) {
            await global.emailService.sendPaymentReminderEmail(user.email, {
              userName: `${user.firstName} ${user.lastName}`,
              laptopModel: laptop.model,
              laptopBrand: laptop.brand,
              totalPrice: totalPrice,
              amountPaid: paymentAmount,
              remainingBalance: newRemaining,
              paymentDate: new Date()
            });
            
            console.log('📧 Payment initiation email sent to:', user.email);
          }
        }
      } catch (emailError) {
        console.error('❌ Error sending payment initiation email:', emailError);
        // Don't fail the payment process if email fails
      }

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
        body: JSON.stringify(req.body, null, 2)
      });
      
      const stkCallback = req.body?.Body?.stkCallback;
      if (!stkCallback) {
        return res.status(400).json({ message: 'Invalid callback data' });
      }

      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      if (!CheckoutRequestID) {
        return res.status(400).json({ message: 'Missing CheckoutRequestID' });
      }

      // Find and update payment status
      const payment = await Payment.findOne({ checkoutId: CheckoutRequestID });
      if (!payment) {
        return res.status(200).json({ message: 'No matching payment found' });
      }

      // Correctly handle success cases
      const isSuccess =
        ResultCode === 0 ||
        ResultDesc === "The service request is processed successfully" ||
        ResultDesc?.toLowerCase().includes('success');

      payment.status = isSuccess ? 'success' : 'failed';
      payment.mpesaResultCode = ResultCode;
      payment.mpesaResultDesc = isSuccess ? "Payment processed successfully" : ResultDesc;

      // Extract transaction details from callback metadata
      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach(item => {
          switch(item.Name) {
            case 'MpesaReceiptNumber':
              payment.mpesaReceiptNumber = item.Value;
              break;
            case 'TransactionDate':
              payment.transactionDate = item.Value;
              break;
            case 'Amount':
              payment.confirmedAmount = item.Value;
              break;
          }
        });
      }

      await payment.save();
      console.log('✅ Payment updated:', {
        checkoutId: CheckoutRequestID,
        status: payment.status,
        amount: payment.amount
      });

      // Emit real-time notification based on payment status
      if (global.notificationService && payment.userId) {
        try {
          const laptop = await require('../models/laptop').findById(payment.laptopId);
          const laptopModel = laptop ? `${laptop.brand} ${laptop.model}` : 'laptop';

          if (isSuccess) {
            // Check if this is the first payment for this laptop and send email
            try {
              const previousPayments = await Payment.find({
                userId: payment.userId,
                laptopId: payment.laptopId,
                status: 'success',
                _id: { $ne: payment._id }
              });

              if (previousPayments.length === 0) {
                // This is the first payment - send email notification
                console.log('🎯 Detected first payment via callback, sending email notification...');
                
                const user = await require('../models/User').findById(payment.userId);
                const laptop = await require('../models/laptop').findById(payment.laptopId);
                
                if (user && laptop && global.emailService) {
                  await global.emailService.sendPaymentReminderEmail(user.email, {
                    userName: `${user.firstName} ${user.lastName}`,
                    laptopModel: laptop.model,
                    laptopBrand: laptop.brand,
                    totalPrice: payment.totalPrice,
                    amountPaid: payment.amount,
                    remainingBalance: payment.remainingBalance,
                    paymentDate: payment.createdAt || new Date()
                  });
                  
                  console.log('📧 First payment email notification sent to:', user.email);
                }
              }
            } catch (emailError) {
              console.error('❌ Error sending first payment email via callback:', emailError);
            }

            await global.notificationService.emitPaymentSuccess(payment.userId, {
              _id: payment._id,
              amount: payment.amount,
              laptopModel,
              remainingBalance: payment.remainingBalance,
              mpesaReceiptNumber: payment.mpesaReceiptNumber
            });
          } else {
            await global.notificationService.emitPaymentFailed(payment.userId, {
              _id: payment._id,
              amount: payment.amount,
              laptopModel,
              reason: ResultDesc || 'Payment failed'
            });
          }
        } catch (notifyError) {
          console.error('❌ Error sending real-time notification:', notifyError);
        }
      }

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

      const response = {
        status: payment.status,
        amount: payment.amount,
        remaining: payment.remainingBalance,
        checkoutId: payment.checkoutId,
        description: payment.mpesaResultDesc || 'Payment processed successfully'
      };

      // Add additional details for successful payments
      if (payment.status === 'success') {
        response.receiptNumber = payment.mpesaReceiptNumber;
        response.transactionDate = payment.transactionDate;
        response.confirmedAmount = payment.confirmedAmount;
      }

      return res.status(200).json(response);

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

  static async deletePayment(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findByIdAndDelete(paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      return res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting payment:', error);
      return res.status(500).json({ error: 'Failed to delete payment' });
    }
  }
}

module.exports = MpesaController;

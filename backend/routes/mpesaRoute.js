const express = require('express');
const MpesaController = require('../controllers/mpesaController');

const router = express.Router();

const authMiddleware = require('../middleware/auth');

// M-Pesa payment routes
router.post('/initiate', authMiddleware(), MpesaController.initiatePayment);
// M-Pesa callback - public endpoint with no auth and detailed logging
router.post('/callback', (req, res, next) => {
  console.log('👉 Callback route hit:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    path: req.path
  });
  next();
}, MpesaController.handleCallback);
// Add OPTIONS handling for the callback URL
router.options('/callback', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).send();
});

router.get('/status', authMiddleware(), MpesaController.checkPaymentStatus);
// Admin route to get all payments
router.get('/payments', authMiddleware(), MpesaController.getAllPayments);

// User route to get their own payments
router.get('/user-payments', authMiddleware(), MpesaController.getUserPayments);

// Get laptop payment details
router.get('/laptop-payment-details/:laptopId', authMiddleware(), MpesaController.getLaptopPaymentDetails);
// Admin route to delete a payment
router.delete('/payments/:paymentId', authMiddleware('admin'), MpesaController.deletePayment);

module.exports = router;
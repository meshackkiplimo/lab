const express = require('express');
const MpesaController = require('../controllers/mpesaController');

const router = express.Router();

const authMiddleware = require('../middleware/auth');

// M-Pesa payment routes
router.post('/initiate', authMiddleware(), MpesaController.initiatePayment);
// M-Pesa callback should be public (no auth) since Safaricom needs to access it
router.post('/callback', MpesaController.handleCallback);
router.get('/status', authMiddleware(), MpesaController.checkPaymentStatus);
// New route for user payments
router.get('/user-payments', authMiddleware(), MpesaController.getUserPayments);

module.exports = router;
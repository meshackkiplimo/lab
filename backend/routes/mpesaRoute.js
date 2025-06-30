const express = require('express');
const MpesaController = require('../controllers/mpesaController');

const router = express.Router();

const authMiddleware = require('../middleware/auth');
router.post('/initiate', authMiddleware(), MpesaController.initiatePayment);
router.post('/callback', MpesaController.handleCallback);
router.get('/status', authMiddleware(), MpesaController.checkPaymentStatus);

module.exports = router;
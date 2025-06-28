const express = require('express');
const MpesaController = require('../controllers/mpesaController');

const router = express.Router();

const authMiddleware = require('../middleware/auth');
router.post('/initiate', authMiddleware(), MpesaController.initiatePayment);
router.post('/callback', MpesaController.handleCallback);

module.exports = router;
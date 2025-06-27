const express = require('express');
const MpesaController = require('../controllers/mpesaController');

const router = express.Router();

router.post('/initiate', MpesaController.initiatePayment);
router.post('/callback', MpesaController.handleCallback);

module.exports = router;
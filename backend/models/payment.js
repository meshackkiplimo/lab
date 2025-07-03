const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  laptopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laptop',
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  remainingBalance: {
    type: Number,
    required: true
  },
  monthlyPercentage: {
    type: Number,
    default: 10
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['Mpesa'],
    default: 'Mpesa',
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending',
  },
  checkoutId: String,
  mpesaReceiptNumber: String,
  transactionDate: String,
  mpesaResultCode: Number,
  mpesaResultDesc: String,
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

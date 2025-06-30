const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: Number,
  method: {
    type: String,
    enum: ['Mpesa'],
    default: 'Mpesa',
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  checkoutRequestID: String,
  mpesaReceiptNumber: String,
  transactionDate: String,
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

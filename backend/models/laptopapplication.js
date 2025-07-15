const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  laptop: { type: mongoose.Schema.Types.ObjectId, ref: 'Laptop', required: true },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    required: true
  },
  status: {
    type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
    amountPaid: { type: Number, default: 0 },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('LaptopApplication', applicationSchema);

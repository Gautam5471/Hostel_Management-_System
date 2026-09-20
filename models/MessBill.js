const mongoose = require('mongoose');

const messBillSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  month: {
    type: String,
    required: true,
    enum: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
  },
  year: {
    type: Number,
    required: true,
    default: 2026,
  },
  totalDaysInMonth: {
    type: Number,
    required: true,
    default: 30,
  },
  dailyRate: {
    type: Number,
    required: true,
    default: 150, // Rs. 150 per day (Breakfast, Lunch, Snacks, Dinner)
  },
  absentDays: {
    type: Number,
    required: true,
    default: 0,
  },
  presentDays: {
    type: Number,
    required: true,
    default: 30,
  },
  baseAmount: {
    type: Number,
    required: true,
  },
  rebateAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  utilityCharge: {
    type: Number,
    default: 250, // Water, hygiene & kitchen maintenance
  },
  netAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Overdue'],
    default: 'Unpaid',
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paidAt: {
    type: Date,
    default: null,
  },
  transactionId: {
    type: String,
    default: '',
  },
  paymentMethod: {
    type: String,
    default: 'Online Portal / UPI',
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate bills for the same student, month, and year
messBillSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MessBill', messBillSchema);

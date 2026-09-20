const mongoose = require('mongoose');

const messLeaveSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1,
  },
  reason: {
    type: String,
    required: [true, 'Reason for mess leave is required (e.g., Home visit, Internship, Academic Fest)'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Approved', // Auto-approved or warden approved for rebate calculations
  },
  adminRemarks: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MessLeave', messLeaveSchema);

const mongoose = require('mongoose');

const allotmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  bedNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  academicYear: {
    type: String,
    default: '2026-2027',
  },
  status: {
    type: String,
    enum: ['Active', 'Vacated', 'Transferred'],
    default: 'Active',
  },
  allottedDate: {
    type: Date,
    default: Date.now,
  },
  vacatedDate: {
    type: Date,
    default: null,
  },
  remarks: {
    type: String,
    default: 'Allotted via Portal',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Allotment', allotmentSchema);

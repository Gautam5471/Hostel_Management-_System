const mongoose = require('mongoose');

const roomRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestType: {
    type: String,
    enum: ['New Allotment', 'Room Change', 'Vacate'],
    required: true,
    default: 'New Allotment',
  },
  preferredBlock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    default: null,
  },
  preferredRoomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Four-Bed', 'Any'],
    default: 'Any',
  },
  targetRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
  },
  currentRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
  },
  reason: {
    type: String,
    required: [true, 'Please state the reason for this request'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
  },
  adminRemarks: {
    type: String,
    default: '',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RoomRequest', roomRequestSchema);

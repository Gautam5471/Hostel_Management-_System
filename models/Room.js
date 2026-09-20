const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Hostel block is required'],
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required (e.g., 101, B-204)'],
    trim: true,
  },
  floor: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },
  roomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Four-Bed'],
    required: true,
    default: 'Double',
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 2,
  },
  occupiedBeds: {
    type: Number,
    default: 0,
    min: 0,
  },
  isAc: {
    type: Boolean,
    default: false,
  },
  hasAttachedBathroom: {
    type: Boolean,
    default: true,
  },
  pricePerMonth: {
    type: Number,
    required: true,
    default: 6000,
  },
  amenities: {
    type: [String],
    default: ['High-speed Wi-Fi', 'Study Table & Chair', 'Wardrobe', 'Ceiling Fan'],
  },
  status: {
    type: String,
    enum: ['Available', 'Full', 'Maintenance'],
    default: 'Available',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique room numbers per block
roomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });

// Pre-save hook to automatically update status based on occupancy
roomSchema.pre('save', function (next) {
  if (this.status !== 'Maintenance') {
    if (this.occupiedBeds >= this.capacity) {
      this.status = 'Full';
    } else {
      this.status = 'Available';
    }
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);

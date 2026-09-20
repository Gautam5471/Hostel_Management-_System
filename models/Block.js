const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Block name is required (e.g., Block A, Ganga Hostel)'],
    unique: true,
    trim: true,
  },
  genderType: {
    type: String,
    enum: ['Boys', 'Girls', 'Co-ed'],
    default: 'Boys',
  },
  totalFloors: {
    type: Number,
    required: true,
    min: 1,
    default: 3,
  },
  description: {
    type: String,
    default: 'Modern hostel block with standard student facilities.',
  },
  wardenInCharge: {
    type: String,
    default: 'Chief Warden',
  },
  contactNumber: {
    type: String,
    default: '+91 9876543210',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Block', blockSchema);

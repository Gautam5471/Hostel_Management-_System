const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['Electrical', 'Plumbing', 'Carpentry', 'Cleaning', 'Internet', 'Appliance', 'Other'],
    required: [true, 'Please select a maintenance category'],
  },
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide details about the issue'],
    trim: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved', 'Closed'],
    default: 'Reported',
  },
  assignedTechnician: {
    type: String,
    default: 'Hostel Maintenance Staff',
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

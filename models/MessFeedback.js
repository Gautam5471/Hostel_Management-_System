const mongoose = require('mongoose');

const messFeedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mealDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  category: {
    type: String,
    enum: ['Taste & Quality', 'Hygiene & Cleanliness', 'Quantity & Portions', 'Staff Courtesy', 'Overall Experience'],
    default: 'Taste & Quality',
  },
  comments: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MessFeedback', messFeedbackSchema);

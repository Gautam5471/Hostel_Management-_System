const mongoose = require('mongoose');

const messMenuSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
    required: true,
  },
  items: {
    type: [String],
    required: [true, 'Please provide at least one menu item'],
  },
  timings: {
    type: String,
    required: true,
  },
  isSpecial: {
    type: Boolean,
    default: false,
  },
  dietaryType: {
    type: String,
    enum: ['Pure Veg', 'Non-Veg Option Available', 'Special Feast'],
    default: 'Pure Veg',
  },
  nutritionHighlight: {
    type: String,
    default: '',
  },
  updatedBy: {
    type: String,
    default: 'Mess Committee',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Unique combination of day and mealType
messMenuSchema.index({ dayOfWeek: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('MessMenu', messMenuSchema);

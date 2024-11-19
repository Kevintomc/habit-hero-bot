const mongoose = require('mongoose');

// Create a Schema for Habit
const habitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  habit: { type: String, required: true },
});

// Create a Model for Habit
const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;

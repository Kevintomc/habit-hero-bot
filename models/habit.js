const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  habitName: { type: String, required: true },
  frequency: { type: String, default: "daily" },
  streak: { type: Number, default: 0 },
  lastLogged: { type: Date, default: null },
});

module.exports = mongoose.model('Habit', habitSchema);

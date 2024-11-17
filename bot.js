// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Load environment variables
const botToken = process.env.BOT_TOKEN;
const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// Initialize Express
const app = express();
app.get('/', (req, res) => res.send('Daily Habit Tracker Bot is running!'));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Habit schema and model
const habitSchema = new mongoose.Schema({
  userId: String,
  habitName: String,
  frequency: String, // e.g., daily, weekly, monthly
  streak: { type: Number, default: 0 },
  lastLogged: Date,
});
const Habit = mongoose.model('Habit', habitSchema);

// Initialize the Telegram bot
const bot = new TelegramBot(botToken, { polling: true });

// Auto-filter for inappropriate words
const bannedWords = ["badword1", "badword2"];
bot.on('message', (msg) => {
  const text = msg.text || '';
  if (bannedWords.some((word) => text.toLowerCase().includes(word))) {
    bot.sendMessage(msg.chat.id, "Inappropriate language is not allowed.");
  }
});

// Command: /start
bot.onText(/\/start/, (msg) => {
  const userId = msg.chat.id;
  bot.sendMessage(
    userId,
    `Welcome to the Daily Habit Tracker Bot! 🌟\n\nHere are some commands to get started:\n` +
    `/addhabit - Add a new habit\n` +
    `/removehabit - Remove an existing habit\n` +
    `/myhabits - View your habits\n` +
    `/logprogress - Log progress for a habit\n` +
    `/stats - View your progress stats\n` +
    `/leaderboard - View leaderboard\n` +
    `/motivation - Get a motivational quote`
  );
});

// Command: /addhabit
bot.onText(/\/addhabit (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const habit = new Habit({ userId, habitName, frequency: "daily" });
    await habit.save();
    bot.sendMessage(userId, `Habit "${habitName}" added successfully!`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(userId, "Error adding habit. Please try again.");
  }
});

// Command: /removehabit
bot.onText(/\/removehabit (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const result = await Habit.findOneAndDelete({ userId, habitName });
    if (result) {
      bot.sendMessage(userId, `Habit "${habitName}" removed successfully!`);
    } else {
      bot.sendMessage(userId, `Habit "${habitName}" not found.`);
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(userId, "Error removing habit. Please try again.");
  }
});

// Command: /myhabits
bot.onText(/\/myhabits/, async (msg) => {
  const userId = msg.chat.id;

  try {
    const habits = await Habit.find({ userId });
    if (habits.length > 0) {
      const habitList = habits.map((habit, index) => `${index + 1}. ${habit.habitName}`).join("\n");
      bot.sendMessage(userId, `Your habits:\n${habitList}`);
    } else {
      bot.sendMessage(userId, "You don't have any habits yet. Add one using /addhabit!");
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(userId, "Error retrieving your habits. Please try again.");
  }
});

// Command: /logprogress
bot.onText(/\/logprogress (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const habit = await Habit.findOne({ userId, habitName });
    if (habit) {
      const today = new Date();
      const lastLogged = new Date(habit.lastLogged);

      // Check if the progress is logged on the same day
      if (today.toDateString() === lastLogged.toDateString()) {
        bot.sendMessage(userId, `You've already logged progress for "${habitName}" today.`);
      } else {
        habit.streak += 1;
        habit.lastLogged = today;
        await habit.save();
        bot.sendMessage(userId, `Progress logged for "${habitName}"! Your current streak is ${habit.streak}.`);
      }
    } else {
      bot.sendMessage(userId, `Habit "${habitName}" not found.`);
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(userId, "Error logging progress. Please try again.");
  }
});

// Command: /motivation
bot.onText(/\/motivation/, (msg) => {
  const quotes = [
    "Stay consistent and you'll achieve your goals! 🌟",
    "Small steps every day lead to big results. 🏆",
    "Your habits shape your future. 💪",
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  bot.sendMessage(msg.chat.id, randomQuote);
});

// Scheduled reminders
cron.schedule("0 9 * * *", async () => {
  const users = await Habit.distinct("userId");
  users.forEach((userId) => {
    bot.sendMessage(userId, "🌟 Daily Reminder: Don't forget to track your habits today!");
  });
});

console.log("Daily Habit Tracker Bot is running!");

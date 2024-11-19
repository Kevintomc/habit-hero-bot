require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const Habit = require('./models/habit');

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Initialize the bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Bot is up and running!');

// Command: /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `Welcome to Habit Hero Bot! Use /addhabit <habit> to add a habit, /removehabit <habit> to remove one, and /myhabits to view your habits.`);
});

// Command: /addhabit
bot.onText(/\/addhabit (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const existingHabit = await Habit.findOne({ userId, habitName });
    if (existingHabit) {
      return bot.sendMessage(userId, `🚨 You already have the habit "${habitName}"!`);
    }

    const habit = new Habit({ userId, habitName });
    await habit.save();

    bot.sendMessage(userId, `🎉 Habit "${habitName}" added successfully!`);
  } catch (err) {
    console.error('Error adding habit:', err);
    bot.sendMessage(userId, `❌ Error adding habit. Please try again.`);
  }
});

// Command: /removehabit
bot.onText(/\/removehabit (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const result = await Habit.deleteOne({ userId, habitName });
    if (result.deletedCount === 0) {
      return bot.sendMessage(userId, `❌ No such habit "${habitName}" found.`);
    }

    bot.sendMessage(userId, `✅ Habit "${habitName}" removed successfully!`);
  } catch (err) {
    console.error('Error removing habit:', err);
    bot.sendMessage(userId, `❌ Error removing habit. Please try again.`);
  }
});

// Command: /myhabits
bot.onText(/\/myhabits/, async (msg) => {
  const userId = msg.chat.id;

  try {
    const habits = await Habit.find({ userId });
    if (habits.length === 0) {
      return bot.sendMessage(userId, `📭 You don't have any habits yet! Use /addhabit to add one.`);
    }

    const habitList = habits.map((h, index) => `${index + 1}. ${h.habitName} (${h.frequency})`).join('\n');
    bot.sendMessage(userId, `📝 Your Habits:\n${habitList}`);
  } catch (err) {
    console.error('Error fetching habits:', err);
    bot.sendMessage(userId, `❌ Error retrieving habits. Please try again.`);
  }
});

// Command: /filterhabits <keyword>
bot.onText(/\/filterhabits (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const keyword = match[1].toLowerCase();

  try {
    const habits = await Habit.find({ userId, habitName: { $regex: keyword, $options: 'i' } });
    if (habits.length === 0) {
      return bot.sendMessage(userId, `🔍 No habits found matching "${keyword}".`);
    }

    const filteredList = habits.map((h, index) => `${index + 1}. ${h.habitName} (${h.frequency})`).join('\n');
    bot.sendMessage(userId, `🔎 Filtered Habits:\n${filteredList}`);
  } catch (err) {
    console.error('Error filtering habits:', err);
    bot.sendMessage(userId, `❌ Error filtering habits. Please try again.`);
  }
});

// Command: /streak <habit>
bot.onText(/\/streak (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const habit = await Habit.findOne({ userId, habitName });
    if (!habit) {
      return bot.sendMessage(userId, `❌ No such habit "${habitName}" found.`);
    }

    bot.sendMessage(userId, `🔥 Streak for "${habitName}": ${habit.streak} days.`);
  } catch (err) {
    console.error('Error fetching streak:', err);
    bot.sendMessage(userId, `❌ Error fetching streak. Please try again.`);
  }
});

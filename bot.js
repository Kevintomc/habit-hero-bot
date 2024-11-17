// Load environment variables from the .env file
require('dotenv').config();

// Import required modules
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const cron = require("node-cron");

// Load environment variables
const botToken = process.env.BOT_TOKEN;
const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();
app.get("/", (req, res) => {
  res.send("My Habit Hero Bot is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Connect to MongoDB
mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Define a schema for habits
const habitSchema = new mongoose.Schema({
  userId: String,
  habitName: String,
  frequency: String,
  lastUpdated: { type: Date, default: Date.now },
});

// Create a model for habits
const Habit = mongoose.model("Habit", habitSchema);

// Initialize the Telegram bot
const bot = new TelegramBot(botToken, { polling: true });

// Command: /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Welcome to My Habit Hero Bot!\n\nYou can use the following commands:\n/addhabit - Add a new habit\n/removehabit - Remove a habit\n/myhabits - View your habits`
  );
});

// Command: /addhabit
bot.onText(/\/addhabit (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const habit = new Habit({ userId, habitName });
    await habit.save();
    bot.sendMessage(userId, `Habit "${habitName}" has been added successfully!`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(userId, "Error adding the habit. Please try again.");
  }
});

// Command: /removehabit
bot.onText(/\/removehabit (.+)/, async (msg, match) => {
  const userId = msg.chat.id;
  const habitName = match[1];

  try {
    const result = await Habit.findOneAndDelete({ userId, habitName });
    if (result) {
      bot.sendMessage(userId, `Habit "${habitName}" has been removed successfully!`);
    } else {
      bot.sendMessage(userId, `Habit "${habitName}" not found.`);
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(userId, "Error removing the habit. Please try again.");
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
      bot.sendMessage(userId, "You have no habits yet. Use /addhabit to add one!");
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(userId, "Error retrieving your habits. Please try again.");
  }
});

// Auto-filter for inappropriate words (Example: Prevent certain words in habit names)
const bannedWords = ["badword1", "badword2"];
bot.on("message", (msg) => {
  const text = msg.text || "";
  if (bannedWords.some((word) => text.toLowerCase().includes(word))) {
    bot.sendMessage(msg.chat.id, "Your message contains inappropriate words and was blocked.");
  }
});

// Scheduled task example (e.g., send daily reminders)
cron.schedule("0 9 * * *", async () => {
  try {
    const users = await Habit.distinct("userId");
    users.forEach((userId) => {
      bot.sendMessage(userId, "Good morning! Don't forget to track your habits today!");
    });
  } catch (err) {
    console.error("Error sending reminders:", err);
  }
});

console.log("My Habit Hero Bot is running with all features!");

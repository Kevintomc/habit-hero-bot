// Import required modules
require('dotenv').config(); // Load environment variables
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// Extract environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

// Validate environment variables
if (!BOT_TOKEN) {
  console.error("❌ Bot token is missing! Make sure BOT_TOKEN is defined in the .env file.");
  process.exit(1);
}
if (!MONGO_URI) {
  console.error("❌ MongoDB URI is missing! Make sure MONGO_URI is defined in the .env file.");
  process.exit(1);
}

// Initialize the bot
const bot = new Telegraf(BOT_TOKEN);

// MongoDB connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Bot commands
bot.start((ctx) => ctx.reply("Welcome to Habit Hero Bot! 🎯\n\nUse the /add command to track new habits."));
bot.command('add', (ctx) => {
  ctx.reply("What habit would you like to track?");
  // Logic for adding a habit can be implemented here
});

// Default handler for unrecognized messages
bot.on('text', (ctx) => {
  ctx.reply("🤔 Sorry, I didn’t understand that. Use /start to see available commands.");
});

// Launch the bot
bot.launch()
  .then(() => console.log("🚀 Bot is running!"))
  .catch((err) => {
    console.error("❌ Bot failed to start:", err);
    process.exit(1);
  });

// Handle graceful shutdown
process.once('SIGINT', () => {
  bot.stop("SIGINT");
  mongoose.connection.close(() => {
    console.log("⚡ MongoDB connection closed.");
    process.exit(0);
  });
});
process.once('SIGTERM', () => {
  bot.stop("SIGTERM");
  mongoose.connection.close(() => {
    console.log("⚡ MongoDB connection closed.");
    process.exit(0);
  });
});

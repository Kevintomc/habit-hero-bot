require('dotenv').config(); // Load environment variables
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');

const app = express();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true, // Not needed for mongoose >6 but included for safety
    useUnifiedTopology: true, // Not needed for mongoose >6 but included for safety
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Telegram Bot Setup
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('❌ Bot Token is required. Make sure it is defined in your .env file.');
}
const bot = new Telegraf(BOT_TOKEN);

// Telegram Bot Commands
bot.start((ctx) => ctx.reply('Welcome! I am your Habit Hero Bot.'));
bot.help((ctx) => ctx.reply('I can help you track your habits! Use commands like /add or /view.'));
bot.command('add', (ctx) => ctx.reply('What habit would you like to add?'));
bot.command('view', (ctx) => ctx.reply('Here are your tracked habits!'));
bot.launch()
  .then(() => console.log('✅ Telegram Bot launched successfully!'))
  .catch((err) => console.error('❌ Telegram Bot launch error:', err));

// Graceful Shutdown for Bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Optional HTTP Server (Required for Render)
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Habit Hero Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Server is running on port ${PORT}`);
});

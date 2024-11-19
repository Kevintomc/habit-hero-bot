// Import required modules
require('dotenv').config(); // Load environment variables from .env
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

// Initialize bot
const bot = new Telegraf(BOT_TOKEN);

// Define a habit schema for MongoDB
const habitSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    habit: { type: String, required: true },
});

// Create a Habit model
const Habit = mongoose.model('Habit', habitSchema);

// Bot commands and handlers
bot.start((ctx) => {
    ctx.reply('Welcome to Habit Hero Bot! 🎯\n\nUse the /add command to track new habits.');
});

bot.command('add', (ctx) => {
    const habitText = ctx.message.text.split(' ').slice(1).join(' '); // Extract the habit text
    if (!habitText) {
        return ctx.reply('❌ Please enter a habit after the /add command.');
    }

    // Save the habit to MongoDB
    const newHabit = new Habit({ userId: ctx.from.id, habit: habitText });
    newHabit
        .save()
        .then(() => {
            ctx.reply(`✅ Habit "${habitText}" added successfully! Keep it up! 💪`);
        })
        .catch((err) => {
            console.error('Error saving habit:', err);
            ctx.reply('❌ There was an issue saving your habit. Please try again later.');
        });
});

bot.on('text', (ctx) => {
    ctx.reply('🤔 Sorry, I didn’t understand that. Use /start to see available commands.');
});

// Express app to handle webhook
const app = express();
app.use(bot.webhookCallback('/secret-path')); // Use a secret path for Telegram webhook

// Connect to MongoDB
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ MongoDB connected successfully!'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
    });

// Start Express server
app.listen(PORT, () => {
    console.log(`🚀 Bot is running on port ${PORT}`);
});

// Launch bot
bot.launch()
    .then(() => console.log('🤖 Bot launched successfully!'))
    .catch((err) => console.error('❌ Bot launch error:', err));

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

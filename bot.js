// Import necessary modules
require('dotenv').config(); // This ensures that environment variables are loaded from .env
const { Telegraf } = require('telegraf'); // Telegram bot library
const mongoose = require('mongoose'); // MongoDB library
const Habit = require('./models/habit'); // Habit model (You'll need to create this model)

// MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('MongoDB URI is missing in the .env file!');
  process.exit(1);
}

// Telegram Bot Token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Telegram Bot Commands

// Start command - welcoming message and bot instructions
bot.start((ctx) => {
  ctx.reply('Welcome to Habit Hero Bot! 🎯\nUse the /add command to track new habits.');
});

// Add command - Collects habit input from user
bot.command('add', async (ctx) => {
  ctx.reply('Please enter the habit you want to track:');
  bot.on('text', async (message) => {
    const habitText = message.message.text;

    if (!habitText) {
      return ctx.reply('🤔 You need to enter a habit!');
    }

    // Save the habit to the database
    try {
      const newHabit = new Habit({
        userId: ctx.from.id,
        habit: habitText,
      });

      await newHabit.save();
      ctx.reply('✅ Your habit has been added and stored!');
    } catch (err) {
      console.error('❌ Error saving habit:', err);
      ctx.reply('❌ There was an error while saving your habit.');
    }
  });
});

// Optional: view stored habits for the user (if you'd like)
bot.command('view', async (ctx) => {
  try {
    const habits = await Habit.find({ userId: ctx.from.id });

    if (habits.length === 0) {
      return ctx.reply('🤔 You have no habits tracked yet!');
    }

    let message = 'Here are your tracked habits:\n';
    habits.forEach((habit, index) => {
      message += `${index + 1}. ${habit.habit}\n`;
    });

    ctx.reply(message);
  } catch (err) {
    console.error('❌ Error retrieving habits:', err);
    ctx.reply('❌ There was an error while fetching your habits.');
  }
});

// Error handling for unknown commands
bot.on('text', (ctx) => {
  ctx.reply('🤔 Sorry, I didn’t understand that. Use /start to see available commands.');
});

// Start the bot
bot.launch().then(() => {
  console.log('🚀 Bot is running...');
}).catch((err) => {
  console.error('❌ Error starting bot:', err);
});


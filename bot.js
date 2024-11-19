require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const Habit = require('./models/habit'); // Assuming you have a Habit model

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Bot setup
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Command to add a new habit
bot.command('add', async (ctx) => {
  const userId = ctx.from.id;
  const habit = ctx.message.text.split(' ').slice(1).join(' ');
  
  if (!habit) {
    return ctx.reply('Please provide a habit to add.');
  }

  const newHabit = new Habit({ userId, habit });
  await newHabit.save();

  return ctx.reply(`Habit "${habit}" added successfully!`);
});

// Command to list habits
bot.command('list', async (ctx) => {
  const userId = ctx.from.id;
  const habits = await Habit.find({ userId });

  if (habits.length === 0) {
    return ctx.reply('You have no habits added yet.');
  }

  const habitList = habits.map(h => h.habit).join('\n');
  return ctx.reply(`Your habits:\n${habitList}`);
});

// Start the bot
bot.launch().then(() => {
  console.log('✅ Bot is running!');
});

// Ensure your app listens to the correct port
const port = process.env.PORT || 3000;

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
require('dotenv').config();

// Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// MongoDB setup
const mongoURI = process.env.MONGO_URI;
mongoose
    .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Define habit schema and model
const habitSchema = new mongoose.Schema({
    userId: String,
    habit: String,
    progress: [
        {
            date: String,
            status: String, // e.g., "completed", "skipped"
        },
    ],
});
const Habit = mongoose.model('Habit', habitSchema);

// Middleware
bot.use(Telegraf.log());

// Bot Commands
bot.start((ctx) => {
    ctx.reply(
        `Welcome, ${ctx.from.first_name}! 👋\n\nI’m your Habit Tracker Bot. Use these commands:\n` +
        `/addhabit - Add a new habit\n` +
        `/listhabits - View your habits\n` +
        `/deletehabit - Remove a habit\n` +
        `/progress - Check your progress`
    );
});

// Add a new habit
bot.command('addhabit', async (ctx) => {
    const habitText = ctx.message.text.split(' ').slice(1).join(' ');
    if (!habitText) {
        return ctx.reply('Please provide the habit name. Usage: /addhabit [habit]');
    }

    const newHabit = new Habit({
        userId: ctx.from.id.toString(),
        habit: habitText,
        progress: [],
    });

    try {
        await newHabit.save();
        ctx.reply(`✅ Added habit: *${habitText}*`, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error saving habit:', error);
        ctx.reply('❌ Failed to add habit. Please try again.');
    }
});

// List habits
bot.command('listhabits', async (ctx) => {
    try {
        const habits = await Habit.find({ userId: ctx.from.id.toString() });
        if (habits.length === 0) {
            return ctx.reply('You don’t have any habits yet. Add one with /addhabit!');
        }

        let reply = '📋 *Your Habits:*\n\n';
        habits.forEach((habit, index) => {
            reply += `${index + 1}. ${habit.habit}\n`;
        });
        ctx.reply(reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error fetching habits:', error);
        ctx.reply('❌ Failed to fetch habits. Please try again.');
    }
});

// Delete a habit
bot.command('deletehabit', async (ctx) => {
    const habitText = ctx.message.text.split(' ').slice(1).join(' ');
    if (!habitText) {
        return ctx.reply('Please specify the habit to delete. Usage: /deletehabit [habit]');
    }

    try {
        const result = await Habit.findOneAndDelete({
            userId: ctx.from.id.toString(),
            habit: habitText,
        });
        if (!result) {
            return ctx.reply('❌ Habit not found. Please check the name and try again.');
        }

        ctx.reply(`✅ Deleted habit: *${habitText}*`, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error deleting habit:', error);
        ctx.reply('❌ Failed to delete habit. Please try again.');
    }
});

// View progress (simple placeholder for now)
bot.command('progress', (ctx) => {
    ctx.reply('📊 Progress tracking is under development!');
});

// Express app and webhook setup
const app = express();
app.use(bodyParser.json());
app.use(bot.webhookCallback('/secret-path'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Set webhook URL
bot.telegram.setWebhook(`https://habit-hero-bot.onrender.com/secret-path`);


// Launch bot (not needed with webhooks)
console.log('🤖 Bot is up and running!');

require('dotenv').config(); // Load environment variables
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// Replace with your own values in .env
const BOT_TOKEN = process.env.BOT_TOKEN; // Your Telegram Bot Token
const MONGO_URI = process.env.MONGO_URI; // Your MongoDB URI

const bot = new Telegraf(BOT_TOKEN);

// MongoDB Habit Schema
const habitSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    habit: { type: String, required: true },
});

const Habit = mongoose.model('Habit', habitSchema);

// User states to track actions
const userStates = {};

// Connect to MongoDB
mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        bot.telegram.sendMessage(
            '❌ Failed to connect to the database. Please contact the developer at therealimposterin@gmail.com for support.'
        );
    });

// Start Command
bot.start((ctx) => {
    ctx.reply(
        "👋 Welcome to Habit Hero Bot! Track your daily habits with ease.\n\n" +
        "Here are the commands you can use:\n" +
        "/add - Add a new habit\n" +
        "/view - View your habits\n" +
        "/delete - Delete a habit\n" +
        "/filter - Filter your habits\n" +
        "/help - See this list again\n\n" +
        "📧 For support, contact the developer at therealimposterin@gmail.com."
    );
});

// Help Command
bot.command('help', (ctx) => {
    ctx.reply(
        "Here's how I can help you:\n" +
        "/add - Add a new habit\n" +
        "/view - View your habits\n" +
        "/delete - Delete a habit\n" +
        "/filter - Filter your habits by keyword\n" +
        "/help - Get this help message again\n\n" +
        "📧 For support, contact the developer at therealimposterin@gmail.com."
    );
});

// Add Habit Command
bot.command('add', (ctx) => {
    const userId = ctx.from.id;

    userStates[userId] = 'adding_habit';
    ctx.reply("✏️ Please type the habit you want to add (e.g., 'Drink water daily').");
});

// Text Handler to Add or Delete Habit
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userState = userStates[userId];

    // Adding Habit
    if (userState === 'adding_habit') {
        const habitText = ctx.message.text.trim();

        if (!habitText) {
            ctx.reply("❌ Please enter a valid habit.");
        } else {
            try {
                await Habit.create({ userId, habit: habitText });
                ctx.reply(`✅ Your habit "${habitText}" has been added successfully!`);
                userStates[userId] = null; // Reset state
            } catch (error) {
                console.error("Error storing habit:", error);
                ctx.reply(
                    "❌ There was an error saving your habit. Please try again later.\nIf the issue persists, contact the developer at therealimposterin@gmail.com."
                );
            }
        }
    } 
    // Deleting Habit
    else if (userState === 'deleting_habit') {
        const habitIndex = parseInt(ctx.message.text.trim(), 10) - 1;

        if (isNaN(habitIndex)) {
            ctx.reply("❌ Please enter a valid number corresponding to a habit.");
        } else {
            try {
                const habits = await Habit.find({ userId });

                if (habitIndex < 0 || habitIndex >= habits.length) {
                    ctx.reply("❌ That number doesn't correspond to any habit. Please try again.");
                } else {
                    const habitToDelete = habits[habitIndex];
                    await Habit.deleteOne({ _id: habitToDelete._id });
                    ctx.reply(`✅ The habit "${habitToDelete.habit}" has been deleted.`);
                    userStates[userId] = null; // Reset state
                }
            } catch (error) {
                console.error("Error deleting habit:", error);
                ctx.reply(
                    "❌ There was an error deleting your habit. Please try again later.\nIf the issue persists, contact the developer at therealimposterin@gmail.com."
                );
            }
        }
    }
});

// View Habits Command
bot.command('view', async (ctx) => {
    const userId = ctx.from.id;

    try {
        const habits = await Habit.find({ userId });

        if (habits.length === 0) {
            ctx.reply("❌ You don't have any habits yet. Use /add to start tracking one!");
        } else {
            const habitList = habits.map((h, index) => `${index + 1}. ${h.habit}`).join('\n');
            ctx.reply(`📝 Here are your habits:\n${habitList}`);
        }
    } catch (error) {
        console.error("Error fetching habits:", error);
        ctx.reply(
            "❌ There was an error retrieving your habits. Please try again later.\nIf the issue persists, contact the developer at therealimposterin@gmail.com."
        );
    }
});

// Delete Habits Command
bot.command('delete', async (ctx) => {
    const userId = ctx.from.id;

    try {
        const habits = await Habit.find({ userId });

        if (habits.length === 0) {
            ctx.reply("❌ You don't have any habits to delete. Use /add to start tracking one!");
        } else {
            const habitList = habits.map((h, index) => `${index + 1}. ${h.habit}`).join('\n');
            ctx.reply(`🗑️ Here are your habits:\n${habitList}\n\nReply with the number of the habit you want to delete.`);

            userStates[userId] = 'deleting_habit';
        }
    } catch (error) {
        console.error("Error fetching habits:", error);
        ctx.reply(
            "❌ There was an error retrieving your habits. Please try again later.\nIf the issue persists, contact the developer at therealimposterin@gmail.com."
        );
    }
});

// Filter Habits Command (search by keyword)
bot.command('filter', async (ctx) => {
    const userId = ctx.from.id;

    ctx.reply("🔍 Type a keyword to filter your habits (e.g., 'drink').");

    bot.on('text', async (ctx) => {
        const keyword = ctx.message.text.trim();

        if (!keyword) {
            ctx.reply("❌ Please enter a valid keyword.");
        } else {
            try {
                const habits = await Habit.find({ userId, habit: { $regex: keyword, $options: 'i' } });

                if (habits.length === 0) {
                    ctx.reply("❌ No habits found with that keyword.");
                } else {
                    const habitList = habits.map((h, index) => `${index + 1}. ${h.habit}`).join('\n');
                    ctx.reply(`📝 Filtered Habits:\n${habitList}`);
                }
            } catch (error) {
                console.error("Error filtering habits:", error);
                ctx.reply(
                    "❌ There was an error filtering your habits. Please try again later.\nIf the issue persists, contact the developer at therealimposterin@gmail.com."
                );
            }
        }
    });
});

// Error handling
bot.catch((err) => {
    console.error("Bot error:", err);
});

// Launch the bot
bot.launch().then(() => {
    console.log("🤖 Bot is up and running!");
}).catch((err) => {
    console.error("❌ Bot failed to start:", err);
});

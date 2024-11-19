const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// Replace with your own bot token
const BOT_TOKEN = "your_bot_token_here";
const MONGO_URI = "your_mongodb_connection_string";

const bot = new Telegraf(BOT_TOKEN);

// MongoDB schema
const habitSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    habit: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Habit = mongoose.model('Habit', habitSchema);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// Temporary storage for user state
const userStates = {};

// Start command
bot.start((ctx) => {
    ctx.reply("Welcome to the Habit Tracker Bot! You can add, view, and track your habits. Type /add to add a habit or /help for more options.");
});

// Help command
bot.command('help', (ctx) => {
    ctx.reply("Here are the available commands:\n/add - Add a new habit\n/view - View your habits\n/delete - Delete a habit\n/help - Get help");
});

// Add habit
bot.command('add', (ctx) => {
    const userId = ctx.from.id;
    userStates[userId] = 'adding_habit';
    ctx.reply("Please enter the habit you want to track.");
});

// Handling text messages based on user state
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userState = userStates[userId];

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
                ctx.reply("❌ There was an error saving your habit. Please try again.");
            }
        }
    } else {
        ctx.reply("I didn't understand that. Use /help to see the available commands.");
    }
});

// View habits
bot.command('view', async (ctx) => {
    const userId = ctx.from.id;

    try {
        const habits = await Habit.find({ userId });

        if (habits.length === 0) {
            ctx.reply("You don't have any habits yet. Use /add to start tracking one!");
        } else {
            const habitList = habits.map((h, index) => `${index + 1}. ${h.habit}`).join('\n');
            ctx.reply(`Here are your habits:\n${habitList}`);
        }
    } catch (error) {
        console.error("Error fetching habits:", error);
        ctx.reply("❌ There was an error retrieving your habits. Please try again.");
    }
});

// Delete habit
bot.command('delete', async (ctx) => {
    const userId = ctx.from.id;

    try {
        const habits = await Habit.find({ userId });

        if (habits.length === 0) {
            ctx.reply("You don't have any habits to delete. Use /add to start tracking one!");
        } else {
            const habitList = habits.map((h, index) => `${index + 1}. ${h.habit}`).join('\n');
            ctx.reply(`Here are your habits:\n${habitList}\n\nReply with the number of the habit you want to delete.`);

            userStates[userId] = 'deleting_habit';
        }
    } catch (error) {
        console.error("Error fetching habits:", error);
        ctx.reply("❌ There was an error retrieving your habits. Please try again.");
    }
});

// Handle habit deletion
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userState = userStates[userId];

    if (userState === 'deleting_habit') {
        const habitIndex = parseInt(ctx.message.text.trim(), 10);

        if (isNaN(habitIndex)) {
            ctx.reply("❌ Please enter a valid number corresponding to the habit you want to delete.");
        } else {
            try {
                const habits = await Habit.find({ userId });
                const habitToDelete = habits[habitIndex - 1];

                if (habitToDelete) {
                    await Habit.deleteOne({ _id: habitToDelete._id });
                    ctx.reply(`✅ Your habit "${habitToDelete.habit}" has been deleted.`);
                } else {
                    ctx.reply("❌ The number you entered does not correspond to any habit. Please try again.");
                }

                userStates[userId] = null; // Reset state
            } catch (error) {
                console.error("Error deleting habit:", error);
                ctx.reply("❌ There was an error deleting your habit. Please try again.");
            }
        }
    }
});

// Handle errors
bot.catch((err) => {
    console.error("Bot error:", err);
});

// Start polling
bot.launch()
    .then(() => console.log("🤖 Bot is up and running!"))
    .catch((err) => console.error("❌ Bot launch error:", err));

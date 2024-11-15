const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000; // Use the port provided by the hosting service or default to 3000

// Add a route to confirm the bot is running
app.get("/", (req, res) => {
  res.send("My Habit Hero Bot is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Your Telegram bot code goes here
// Import required modules
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Telegram bot token and MongoDB connection string
const botToken = '7498218582:AAGtTNpsEimCMfijtCjvSGDzNNIXekhffBQ';  // replace with your actual bot token
const mongoUri = 'mongodb+srv://kevintomc008:dwuvxK3Aimv6ce4Z@cluster0.9uvel.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // replace with your MongoDB URI

// Connect to MongoDB
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// Define a schema for habits
const habitSchema = new mongoose.Schema({
    userId: String,
    habitName: String,
    reminderTime: String, // Store reminder time in HH:mm format
    addedDate: { type: Date, default: Date.now },
});

// Create a model for habits
const Habit = mongoose.model('Habit', habitSchema);

// Initialize Telegram bot
const bot = new TelegramBot(botToken, { polling: true });
console.log('MyHabitHeroBot is running with all features!');

// Start command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome to MyHabitHeroBot! You can track your habits and set reminders.");
});

// Add habit command
bot.onText(/\/addhabit/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Please enter the habit name you want to add:");
    
    bot.once('message', async (msg) => {
        const habitName = msg.text;
        bot.sendMessage(chatId, "Enter the reminder time in HH:mm format (e.g., 08:30 for 8:30 AM):");

        bot.once('message', async (msg) => {
            const reminderTime = msg.text;
            try {
                // Save the habit in MongoDB
                const habit = new Habit({
                    userId: chatId,
                    habitName: habitName,
                    reminderTime: reminderTime,
                });
                await habit.save();
                bot.sendMessage(chatId, `Habit "${habitName}" added with a reminder set for ${reminderTime}.`);
            } catch (error) {
                bot.sendMessage(chatId, "Failed to add habit. Please try again.");
            }
        });
    });
});

// List habits command
bot.onText(/\/listhabits/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const habits = await Habit.find({ userId: chatId });
        if (habits.length === 0) {
            bot.sendMessage(chatId, "You have no habits set up.");
        } else {
            let response = "Here are your habits:\n";
            habits.forEach((habit, index) => {
                response += `${index + 1}. ${habit.habitName} - Reminder at ${habit.reminderTime}\n`;
            });
            bot.sendMessage(chatId, response);
        }
    } catch (error) {
        bot.sendMessage(chatId, "Failed to retrieve habits. Please try again.");
    }
});

// Set up daily reminders for all habits
cron.schedule('0 * * * *', async () => {
    const currentTime = new Date().toTimeString().slice(0, 5);
    const habits = await Habit.find({ reminderTime: currentTime });

    habits.forEach((habit) => {
        bot.sendMessage(habit.userId, `Reminder: Time for "${habit.habitName}"!`);
    });
});

// Help command
bot.onText(/\/help/, (msg) => {
    const helpText = `
Here are some commands to get started:
- /addhabit - Add a new habit with a reminder time
- /listhabits - List all your added habits
- /help - Show this help message
    `;
    bot.sendMessage(msg.chat.id, helpText);
});


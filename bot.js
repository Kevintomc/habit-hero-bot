require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// Create a new Telegraf bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// MongoDB User Schema
const userSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true },
    username: { type: String },
    habits: [String]
});

const User = mongoose.model('User', userSchema);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('✅ MongoDB connected successfully!');
    })
    .catch(err => {
        console.log('❌ MongoDB connection error:', err);
    });

// Start command - Welcome message
bot.start((ctx) => {
    ctx.reply("Welcome to Habit Hero Bot! 🎯\n\nUse the /add command to track new habits.");
});

// Add command - to start habit input process
bot.command('add', (ctx) => {
    ctx.reply("Please enter the habit you want to track:");
    
    // Listen for the text message from the user
    bot.on('text', async (ctx) => {
        const habit = ctx.message.text;
        
        // Ignore if the user just sends /add again (i.e., no habit input)
        if (habit === "/add") return;
        
        // Check if the user exists in the database or create a new user
        const user = await User.findOne({ userId: ctx.from.id });
        
        if (user) {
            // Add the habit to the user's list and save it
            user.habits.push(habit);
            await user.save();
            ctx.reply("Your habit has been added successfully! ✅");
        } else {
            // If the user doesn't exist, create a new user
            const newUser = new User({
                userId: ctx.from.id,
                username: ctx.from.username || 'Anonymous',
                habits: [habit]
            });
            await newUser.save();
            ctx.reply("Your habit has been added successfully! ✅");
        }
    });
});

// Error handling for unrecognized commands or messages
bot.on('text', (ctx) => {
    ctx.reply("🤔 Sorry, I didn’t understand that. Use /start to see available commands.");
});

// Start the bot
bot.launch().then(() => {
    console.log('🚀 Bot is running!');
}).catch(err => {
    console.log('❌ Bot launch error:', err);
});

const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// Initialize the bot
const bot = new Telegraf('YOUR_BOT_TOKEN'); // Replace with your actual bot token

// Connect to MongoDB
mongoose
    .connect('YOUR_MONGODB_URI', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((error) => console.error('❌ MongoDB connection error:', error));

// Define the Mongoose schema and model
const habitSchema = new mongoose.Schema({
    name: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
});

const Habit = mongoose.model('Habit', habitSchema);

// Command to view all records
bot.command('view', async (ctx) => {
    try {
        const data = await Habit.find();
        if (data.length === 0) {
            ctx.reply('No records found.');
        } else {
            const formattedData = data.map((item) => `• ${item.name}: ${item.description}`).join('\n');
            ctx.reply(`Here are your records:\n${formattedData}`);
        }
    } catch (error) {
        console.error('Error fetching records:', error);
        ctx.reply('Failed to fetch records. Please try again later.');
    }
});

// Command to delete a specific record
bot.command('delete', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1); // Extract arguments after the command
    if (args.length === 0) {
        return ctx.reply('Please specify the name of the habit to delete, e.g., /delete HabitName.');
    }

    const habitName = args.join(' ');
    try {
        const result = await Habit.deleteOne({ name: habitName });
        if (result.deletedCount > 0) {
            ctx.reply(`Successfully deleted: ${habitName}`);
        } else {
            ctx.reply(`No matching record found for: ${habitName}`);
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        ctx.reply('Failed to delete the record. Please try again later.');
    }
});

// Command to filter records
bot.command('filter', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1); // Extract arguments after the command
    if (args.length === 0) {
        return ctx.reply('Please specify a keyword to filter, e.g., /filter keyword.');
    }

    const keyword = args.join(' ');
    try {
        const results = await Habit.find({ name: { $regex: keyword, $options: 'i' } });
        if (results.length === 0) {
            ctx.reply(`No records found matching: ${keyword}`);
        } else {
            const formattedResults = results.map((item) => `• ${item.name}: ${item.description}`).join('\n');
            ctx.reply(`Matching records:\n${formattedResults}`);
        }
    } catch (error) {
        console.error('Error filtering records:', error);
        ctx.reply('Failed to filter records. Please try again later.');
    }
});

// Start the bot
bot.launch().then(() => {
    console.log('🚀 Bot is up and running');
}).catch((error) => {
    console.error('❌ Bot failed to start:', error);
});

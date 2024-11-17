const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");

// Configuration
const TOKEN = "7498218582:AAGtTNpsEimCMfijtCjvSGDzNNIXekhffBQ"; // Replace with your actual bot token
const MONGO_URI = "mongodb+srv://kevintomc008:dwuvxK3Aimv6ce4Z@cluster0.9uvel.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = `https://habit-hero-bot.onrender.com`; // Replace with your public domain or Render URL

// Express setup
const app = express();
app.use(bodyParser.json());

// MongoDB setup
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Habit Schema
const habitSchema = new mongoose.Schema({
  userId: String,
  habitName: String,
});
const Habit = mongoose.model("Habit", habitSchema);

// Telegram Bot setup
const bot = new TelegramBot(TOKEN, { webHook: true });
bot.setWebHook(WEBHOOK_URL);

// Express endpoint for Telegram Webhook
app.post(`/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Command Handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Welcome to My Habit Hero Bot! 🎯\nYou can:\n- Add a habit: /add [habit name]\n- Remove a habit: /remove [habit name]\n- View your habits: /list\n- Search habits: /search [keyword]\n`
  );
});

bot.onText(/\/add (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const habitName = match[1].trim();

  try {
    await Habit.create({ userId: chatId.toString(), habitName });
    bot.sendMessage(chatId, `✅ Habit "${habitName}" has been added.`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Could not add the habit. Please try again.");
  }
});

bot.onText(/\/remove (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const habitName = match[1].trim();

  try {
    const result = await Habit.findOneAndDelete({
      userId: chatId.toString(),
      habitName,
    });

    if (result) {
      bot.sendMessage(chatId, `✅ Habit "${habitName}" has been removed.`);
    } else {
      bot.sendMessage(chatId, `❌ Habit "${habitName}" not found.`);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Could not remove the habit. Please try again.");
  }
});

bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const habits = await Habit.find({ userId: chatId.toString() });
    if (habits.length > 0) {
      const habitList = habits.map((habit, index) => `${index + 1}. ${habit.habitName}`).join("\n");
      bot.sendMessage(chatId, `📝 Your Habits:\n${habitList}`);
    } else {
      bot.sendMessage(chatId, "You have no habits saved. Add some with /add [habit name].");
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Could not retrieve your habits. Please try again.");
  }
});

bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const keyword = match[1].trim();

  try {
    const habits = await Habit.find({
      userId: chatId.toString(),
      habitName: { $regex: keyword, $options: "i" },
    });

    if (habits.length > 0) {
      const habitList = habits.map((habit, index) => `${index + 1}. ${habit.habitName}`).join("\n");
      bot.sendMessage(chatId, `🔍 Habits matching "${keyword}":\n${habitList}`);
    } else {
      bot.sendMessage(chatId, `No habits found matching "${keyword}".`);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Could not search habits. Please try again.");
  }
});

// Default message handler
bot.on("message", (msg) => {
  if (!msg.text.startsWith("/")) {
    bot.sendMessage(msg.chat.id, "❓ I don't recognize that command. Type /start for help.");
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

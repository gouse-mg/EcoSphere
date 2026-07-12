// config/db.js
// Handles the connection to MongoDB using Mongoose

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Exit the process with failure if we cannot connect to the database
    process.exit(1);
  }
};

module.exports = connectDB;

// Import mongoose for MongoDB connection
const mongoose = require("mongoose")

// Async function to connect database
const connectDB = async () => {

 try {

   // Connect MongoDB using URI
   await mongoose.connect(process.env.MONGO_URI)

   console.log("MongoDB Connected")

 } catch (error) {

   console.error("Database connection failed:", error.message)

   process.exit(1)

 }

}

// Export connection function
module.exports = connectDB
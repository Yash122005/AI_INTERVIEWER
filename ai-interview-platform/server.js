// Import dependencies
const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")

// Import database connection
const connectDB = require("./config/db")

// Load environment variables
dotenv.config()

// Connect to MongoDB
connectDB()

// Initialize express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Test route
app.get("/", (req, res) => {

 res.send("AI Interview Backend Running")

})

// Define port
const PORT = process.env.PORT || 5000

// Start server
app.listen(PORT, () => {

 console.log(`Server running on port ${PORT}`)

})
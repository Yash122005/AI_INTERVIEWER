import dotenv from "dotenv";
dotenv.config();
console.log("GMAIL_USER:", process.env.GMAIL_USER ? "FOUND" : "MISSING");
console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "FOUND" : "MISSING");
console.log("MONGO_URI:", process.env.MONGO_URI ? "FOUND" : "MISSING");

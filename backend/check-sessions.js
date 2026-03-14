import mongoose from "mongoose";
import dotenv from "dotenv";
import Session from "./models/Session.model.js";

dotenv.config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    const session = await Session.findOne().sort({ createdAt: -1 });
    if (session) {
      console.log("Last Session:");
      console.log("ID:", session._id);
      console.log("Token:", session.shareableToken);
      console.log("Status:", session.status);
    } else {
      console.log("No sessions found");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();

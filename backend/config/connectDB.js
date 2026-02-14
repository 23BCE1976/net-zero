import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DB_USER) {
  throw new Error("Set DB_USER in the .env file");
}

if (!process.env.DB_PASSWORD) {
  throw new Error("Set DB_PASSWORD in the .env file");
}

const DB_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.s1svx5c.mongodb.net/`;

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("Successfully connected to the database");
  } catch (error) {
    console.log("Failed to connect the database");
    process.exit(1);
  }
};

export default connectDB;

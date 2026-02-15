import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/connectDB.js";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.get("/", (request, response) => {
  return response.status(200).json({
    status: true, 
    message: "API is running successfully",
    service: "Net Zero Backend",
    version: "1.0.0",
    authors: ["Arnab Kundu", "Anubhav Jha"],
    timestamp: new Date().toISOString(),
  });
});

await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});
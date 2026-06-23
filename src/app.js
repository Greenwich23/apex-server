import express from "express";

const app = express(); // create an express app

app.use(express.json()); // middleware to parse json data in request body

// routes imported
import authRoutes from "./routes/customer/auth.routes.js";

app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/posts", postRoutes);

// example route : http://localhost:4000/api/v1/users/register

export default app;

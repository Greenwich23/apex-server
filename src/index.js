import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

const startServer = async () => {
  console.log("Starting server...");
  try {
    console.log("MONGO_URI:", process.env.MONGO_URI); // Log the MongoDB URI to the console for debugging
    await connectDB();
    app.on("error", (error) => {
      console.error("Error starting server:", error);
      throw error; // Rethrow the error to be caught by the outer try-catch
    });

    app.listen(process.env.PORT || 6000, () => {
      console.log(`Server running on port ${process.env.PORT || 6000}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

startServer();
// console.log("Server is running...");

// writing authentication apis - login, logout and register, and also writing the user model and the user controller to handle the logic for these apis.

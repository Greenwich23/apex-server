import express from "express";
import cors from "cors";
import morgan from "morgan";
import customerRoutes from "./routes/customer/index.js";
import adminRoutes from "./routes/admin/index.js";
import errorHandler from "./middleware/errorHandler.js";
import driverRoutes from "./routes/driver/return.routes.js";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
);
app.use("/api/payments/paystack/webhook", express.json());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// apex-server/src/app.js
app.use(
  cors({
    origin: [
      process.env.CUSTOMER_URL || "http://localhost:5173",
      process.env.ADMIN_URL || "http://localhost:3001",
      "https://apexsportsfitness.netlify.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("/*splat", cors());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// ─── BODY PARSERS ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── REQUEST LOGGER (dev only) ────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ success: true, message: "Apex API is running" });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api", customerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/delivery/return", driverRoutes);

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
// must be last — after all routes
// app.use(errorHandler);

export default app;
